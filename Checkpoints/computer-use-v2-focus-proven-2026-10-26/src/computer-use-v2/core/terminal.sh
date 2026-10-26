#!/usr/bin/env bash
# terminal.sh - L4. tmux, always (blueprint section 7). Sourced after lib.sh.
#
#   term_send ID TEXT [--no-enter]   type TEXT into the instance's terminal (and press Enter)
#   term_read ID [LINES]             the pane's current contents
#
# A pipe is not a terminal: it has no echo, no scrollback and no job control, and a program
# that checks isatty behaves differently. The terminal is a real PTY under a tmux server
# that belongs to THIS instance only (tmux -L cu-<id>), so seven instances never share one.
# The session is named cu-<id>-0 and is CREATED on first use, never silently dropped.

term_sock() { printf 'cu-%s' "$1"; }
term_sess() { printf 'cu-%s-0' "$1"; }

term_ensure() {
  local id="$1" slot
  need tmux NO_TERMINAL
  if ! tmux -L "$(term_sock "$id")" has-session -t "$(term_sess "$id")" 2>/dev/null; then
    slot="$(rec_get "$id" x_slot 2>/dev/null || true)"
    tmux -L "$(term_sock "$id")" new-session -d -s "$(term_sess "$id")" -x 200 -y 50 \
      ${slot:+-e "DISPLAY=:$slot"} 2>/dev/null \
      || refuse TERMINAL_FAILED "could not create tmux session $(term_sess "$id")"
  fi
}

term_send() {
  local id="$1" text="$2" enter="${3:-1}"
  term_ensure "$id"
  tmux -L "$(term_sock "$id")" send-keys -t "$(term_sess "$id")" -l -- "$text" || refuse TERMINAL_FAILED "send-keys"
  [ "$enter" = 1 ] && tmux -L "$(term_sock "$id")" send-keys -t "$(term_sess "$id")" Enter
  return 0
}

term_read() {
  local id="$1" lines="${2:-50}"
  term_ensure "$id"
  tmux -L "$(term_sock "$id")" capture-pane -p -t "$(term_sess "$id")" -S "-$lines" || refuse TERMINAL_FAILED "capture-pane"
}
