~/.omp/agent/managed-skills/computer-use-virtual-display/scripts/agent-display.sh up
# -> AGENT_DISPLAY=:<slot> (weston picks :3+; GNOME squats 0-2)
# -> a "Weston Compositor" floating window appears on the operator's screen

# launch a GUI app INTO the surface (Electron example):
agent-display.sh app /usr/lib/agent-orchestrator/agent-orchestrator --ozone-platform=x11
# X/GTK apps: env -u WAYLAND_DISPLAY GDK_BACKEND=x11 REQUIRED (else they leak
# Wayland-native onto the operator's desktop and crash inside weston)
