// nofocus.c - LD_PRELOAD interposer for the compositor process (weston's x11 backend).
//
// PROBLEM (measured 2026-10-26 on a clean replica display, mutter 46.2 as the window
// manager, paired A/B on separate fresh displays):
//   libweston-13/x11-backend.so imports xcb_create_window / xcb_map_window and
//   references none of the _NET_WM_USER_TIME atoms. The host window manager therefore
//   sees a window with NO user-time at map and applies its default focus-on-map policy:
//   the compositor window takes focus AND the top of the stack.
//     A (no interposer): focus STOLEN, weston on TOP, _NET_WM_USER_TIME not found
//     B (this library) : focus KEPT,   _NET_WM_USER_TIME = 0
//   Every map is one focus theft, so every leaked or restarted compositor was one more.
//
// WHAT THIS DOES - two EWMH hints, set on the SAME connection immediately BEFORE the map
// request, which is the moment the window manager reads them:
//   _NET_WM_USER_TIME = 0     EWMH: a window whose user time is 0 must NOT be focused when
//                             it is mapped.
//   _NET_WM_STATE = [BELOW]   (only when NOFOCUS_BELOW=1) the window is placed UNDER the
//                             operator's windows from its first frame. The adapter releases
//                             it to the normal layer afterwards, so a human can still click
//                             it forward; it never starts on top.
//
// Nothing else about the window changes. The compositor is otherwise untouched.
//
// NOFOCUS_TRACE=1 prints one line per map to stderr: "[nofocus] map win=0x.. user_time=0
// below=0|1". The adapter reads that line to learn the host window id EXACTLY, with no
// title heuristic, and refuses SHIM_NOT_LOADED when it is absent.
#define _GNU_SOURCE
#include <dlfcn.h>
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>
#include <xcb/xcb.h>

static xcb_atom_t intern(xcb_connection_t *c, const char *name)
{
    xcb_intern_atom_cookie_t ck = xcb_intern_atom(c, 0, (uint16_t)strlen(name), name);
    xcb_intern_atom_reply_t *r = xcb_intern_atom_reply(c, ck, NULL);
    xcb_atom_t a = 0;
    if (r) { a = r->atom; free(r); }
    return a;
}

xcb_void_cookie_t xcb_map_window(xcb_connection_t *c, xcb_window_t w)
{
    static xcb_void_cookie_t (*real)(xcb_connection_t *, xcb_window_t);
    static xcb_atom_t a_user_time, a_state, a_below;
    if (!real) real = dlsym(RTLD_NEXT, "xcb_map_window");

    if (!a_user_time) a_user_time = intern(c, "_NET_WM_USER_TIME");
    if (!a_state)     a_state     = intern(c, "_NET_WM_STATE");
    if (!a_below)     a_below     = intern(c, "_NET_WM_STATE_BELOW");

    uint32_t ut = 0;
    if (a_user_time)
        xcb_change_property(c, XCB_PROP_MODE_REPLACE, w, a_user_time,
                            XCB_ATOM_CARDINAL, 32, 1, &ut);

    const char *below = getenv("NOFOCUS_BELOW");
    int want_below = below && below[0] == '1';
    if (want_below && a_state && a_below) {
        uint32_t st = a_below;
        xcb_change_property(c, XCB_PROP_MODE_REPLACE, w, a_state,
                            XCB_ATOM_ATOM, 32, 1, &st);
    }

    if (getenv("NOFOCUS_TRACE")) {
        char b[96];
        int n = snprintf(b, sizeof b, "[nofocus] map win=0x%x user_time=0 below=%d\n",
                         w, want_below ? 1 : 0);
        (void)!write(2, b, (size_t)n);
    }
    return real(c, w);
}
