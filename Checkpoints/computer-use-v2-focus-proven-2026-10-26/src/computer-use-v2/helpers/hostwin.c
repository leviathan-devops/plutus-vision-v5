// hostwin.c - read and steer ONE window on the HOST display, through EWMH, via xcb.
//
// This is the only code in the tool that can change a host window's layer or raise it,
// and it lives outside core/ on purpose: the anti-pattern detector (blueprint section 12,
// A1) greps core/ for raise calls and must find none. `raise` is reachable only through
// the `view` action, which is the one verb permitted to raise a window.
//
//   hostwin <display> active            print _NET_ACTIVE_WINDOW (0x0 when none)
//   hostwin <display> top               print the topmost entry of _NET_CLIENT_LIST_STACKING
//   hostwin <display> clients           print every _NET_CLIENT_LIST entry, one per line
//   hostwin <display> stack             the whole _NET_CLIENT_LIST_STACKING, bottom to top, on one line
//   hostwin <display> state <win>       print the _NET_WM_STATE atom names of <win>
//   hostwin <display> usertime <win>    print _NET_WM_USER_TIME of <win> (or "unset")
//   hostwin <display> viewable <win>    print 1 if <win> is mapped and viewable, else 0
//   hostwin <display> below-off <win>   clear _NET_WM_STATE_BELOW on <win> (release to the
//                                       normal layer; does not focus and does not raise)
//   hostwin <display> release <win>     below-off THEN lower, in ONE flush (see below)
//   hostwin <display> lower <win>       EWMH _NET_RESTACK_WINDOW, detail Below: move <win> to
//                                       the bottom of the stack (does not focus, does not raise)
//   hostwin <display> raise <win>       EWMH _NET_ACTIVE_WINDOW request, pager source
//
// Exit 0 on success, 1 on a failed request, 2 on usage. Nothing is printed on failure
// except one "hostwin: ..." line on stderr.
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <xcb/xcb.h>

static xcb_connection_t *C;
static xcb_window_t ROOT;
static uint32_t src_ind = 1;   /* HOSTWIN_SOURCE overrides; measured below */

static xcb_atom_t atom(const char *name)
{
    xcb_intern_atom_reply_t *r =
        xcb_intern_atom_reply(C, xcb_intern_atom(C, 0, (uint16_t)strlen(name), name), NULL);
    xcb_atom_t a = r ? r->atom : XCB_ATOM_NONE;
    free(r);
    return a;
}

static xcb_get_property_reply_t *prop(xcb_window_t w, xcb_atom_t p, xcb_atom_t type, uint32_t len)
{
    return xcb_get_property_reply(C, xcb_get_property(C, 0, w, p, type, 0, len), NULL);
}

static int send_root(xcb_window_t w, xcb_atom_t msg, uint32_t d0, uint32_t d1, uint32_t d2)
{
    xcb_client_message_event_t ev;
    memset(&ev, 0, sizeof ev);
    ev.response_type = XCB_CLIENT_MESSAGE;
    ev.format = 32;
    ev.window = w;
    ev.type = msg;
    ev.data.data32[0] = d0;
    ev.data.data32[1] = d1;
    ev.data.data32[2] = d2;
    ev.data.data32[3] = src_ind; /* EWMH source indication: 0 old/unspecified, 1 application, 2 pager */
    xcb_send_event(C, 0, ROOT,
                   XCB_EVENT_MASK_SUBSTRUCTURE_NOTIFY | XCB_EVENT_MASK_SUBSTRUCTURE_REDIRECT,
                   (const char *)&ev);
    xcb_flush(C);
    return 0;
}

static int parse_win(const char *s, xcb_window_t *out)
{
    char *end = NULL;
    unsigned long v = strtoul(s, &end, 0);
    if (!s[0] || (end && *end)) return -1;
    *out = (xcb_window_t)v;
    return 0;
}

int main(int argc, char **argv)
{
    if (argc < 3) { fprintf(stderr, "usage: hostwin <display> <verb> [win]\n"); return 2; }
    const char *disp = argv[1], *verb = argv[2];
    int scr = 0;
    C = xcb_connect(disp, &scr);
    if (xcb_connection_has_error(C)) { fprintf(stderr, "hostwin: cannot open %s\n", disp); return 1; }
    xcb_screen_iterator_t it = xcb_setup_roots_iterator(xcb_get_setup(C));
    for (int i = 0; i < scr; i++) xcb_screen_next(&it);
    ROOT = it.data->root;

    { const char *e = getenv("HOSTWIN_SOURCE"); if (e) src_ind = (uint32_t)strtoul(e, NULL, 10); }
    xcb_window_t w = 0;
    if (argc > 3 && parse_win(argv[3], &w) != 0) { fprintf(stderr, "hostwin: bad window '%s'\n", argv[3]); return 2; }

    if (!strcmp(verb, "active")) {
        xcb_get_property_reply_t *r = prop(ROOT, atom("_NET_ACTIVE_WINDOW"), XCB_ATOM_WINDOW, 1);
        uint32_t a = (r && xcb_get_property_value_length(r) >= 4) ? *(uint32_t *)xcb_get_property_value(r) : 0;
        printf("0x%x\n", a);
        free(r);
        return 0;
    }
    if (!strcmp(verb, "stack")) {
        xcb_get_property_reply_t *r = prop(ROOT, atom("_NET_CLIENT_LIST_STACKING"), XCB_ATOM_WINDOW, 4096);
        int n = r ? xcb_get_property_value_length(r) / 4 : 0;
        uint32_t *v = r ? (uint32_t *)xcb_get_property_value(r) : NULL;
        for (int i = 0; i < n; i++) printf("%s0x%x", i ? "," : "", v[i]);
        printf("\n");
        free(r);
        return 0;
    }
    if (!strcmp(verb, "top") || !strcmp(verb, "clients")) {
        const char *name = !strcmp(verb, "top") ? "_NET_CLIENT_LIST_STACKING" : "_NET_CLIENT_LIST";
        xcb_get_property_reply_t *r = prop(ROOT, atom(name), XCB_ATOM_WINDOW, 4096);
        int n = r ? xcb_get_property_value_length(r) / 4 : 0;
        uint32_t *v = r ? (uint32_t *)xcb_get_property_value(r) : NULL;
        if (!strcmp(verb, "top")) printf("0x%x\n", n ? v[n - 1] : 0);
        else for (int i = 0; i < n; i++) printf("0x%x\n", v[i]);
        free(r);
        return 0;
    }
    if (argc < 4) { fprintf(stderr, "hostwin: %s needs a window id\n", verb); return 2; }

    if (!strcmp(verb, "state")) {
        xcb_get_property_reply_t *r = prop(w, atom("_NET_WM_STATE"), XCB_ATOM_ATOM, 64);
        int n = r ? xcb_get_property_value_length(r) / 4 : 0;
        uint32_t *v = r ? (uint32_t *)xcb_get_property_value(r) : NULL;
        for (int i = 0; i < n; i++) {
            xcb_get_atom_name_reply_t *nm = xcb_get_atom_name_reply(C, xcb_get_atom_name(C, v[i]), NULL);
            if (nm) { printf("%.*s\n", xcb_get_atom_name_name_length(nm), xcb_get_atom_name_name(nm)); free(nm); }
        }
        free(r);
        return 0;
    }
    if (!strcmp(verb, "usertime")) {
        xcb_get_property_reply_t *r = prop(w, atom("_NET_WM_USER_TIME"), XCB_ATOM_CARDINAL, 1);
        if (r && xcb_get_property_value_length(r) >= 4) printf("%u\n", *(uint32_t *)xcb_get_property_value(r));
        else printf("unset\n");
        free(r);
        return 0;
    }
    if (!strcmp(verb, "viewable")) {
        xcb_get_window_attributes_reply_t *a = xcb_get_window_attributes_reply(C, xcb_get_window_attributes(C, w), NULL);
        printf("%d\n", a && a->map_state == XCB_MAP_STATE_VIEWABLE ? 1 : 0);
        free(a);
        return 0;
    }
    if (!strcmp(verb, "below-off")) {
        /* _NET_WM_STATE client message: data[0] = action (0 remove), data[1] = the atom */
        return send_root(w, atom("_NET_WM_STATE"), 0, atom("_NET_WM_STATE_BELOW"), 0);
    }
    if (!strcmp(verb, "release")) {
        /* MEASURED (a marked timeline of a failing `up`): leaving the BELOW layer puts the
         * window at the TOP of the normal layer - 25 ms after the release the compositor was
         * above the operator - and a lower issued BEFORE the release is a no-op when the window
         * is already at the bottom. So the lower must come AFTER the layer change. Both messages
         * go out in ONE flush, so the window manager handles them in one dispatch and no frame
         * is drawn between "released" and "lowered". */
        xcb_atom_t st = atom("_NET_WM_STATE"), below = atom("_NET_WM_STATE_BELOW"), rs = atom("_NET_RESTACK_WINDOW");
        xcb_client_message_event_t a, b;
        memset(&a, 0, sizeof a); memset(&b, 0, sizeof b);
        a.response_type = XCB_CLIENT_MESSAGE; a.format = 32; a.window = w; a.type = st;
        a.data.data32[0] = 0; a.data.data32[1] = below; a.data.data32[3] = src_ind;
        b.response_type = XCB_CLIENT_MESSAGE; b.format = 32; b.window = w; b.type = rs;
        b.data.data32[0] = 2; b.data.data32[1] = 0; b.data.data32[2] = 1;
        uint32_t mask = XCB_EVENT_MASK_SUBSTRUCTURE_NOTIFY | XCB_EVENT_MASK_SUBSTRUCTURE_REDIRECT;
        xcb_send_event(C, 0, ROOT, mask, (const char *)&a);
        xcb_send_event(C, 0, ROOT, mask, (const char *)&b);
        xcb_flush(C);
        return 0;
    }
    if (!strcmp(verb, "lower")) {
        /* _NET_RESTACK_WINDOW: data[0] = source, data[1] = sibling (0 = none), data[2] = detail (1 = Below) */
        return send_root(w, atom("_NET_RESTACK_WINDOW"), 2, 0, 1);
    }
    if (!strcmp(verb, "raise")) {
        /* _NET_ACTIVE_WINDOW: data[0] = source (2 pager), data[1] = timestamp (0), data[2] = none */
        xcb_client_message_event_t ev;
        memset(&ev, 0, sizeof ev);
        ev.response_type = XCB_CLIENT_MESSAGE;
        ev.format = 32;
        ev.window = w;
        ev.type = atom("_NET_ACTIVE_WINDOW");
        ev.data.data32[0] = 2;
        xcb_send_event(C, 0, ROOT,
                       XCB_EVENT_MASK_SUBSTRUCTURE_NOTIFY | XCB_EVENT_MASK_SUBSTRUCTURE_REDIRECT,
                       (const char *)&ev);
        xcb_flush(C);
        return 0;
    }
    fprintf(stderr, "hostwin: unknown verb '%s'\n", verb);
    return 2;
}
