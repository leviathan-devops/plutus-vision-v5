import pathlib
p = pathlib.Path("/home/leviathan/JARVIS_WORKSPACE/Shared_Workspace/PLUTUS_VISION/plutus-vision-v0.pine")
L = p.read_text().split("\n")
print("=== SMC 94-113 ===")
for i in range(93, 113):
    print(f"{i+1:5}: {L[i]}")
print()
print("=== SWEEPS 877-892 ===")
for i in range(876, 892):
    print(f"{i+1:5}: {L[i]}")
print()
print("=== VOIDS 1053-1068 ===")
for i in range(1052, 1068):
    print(f"{i+1:5}: {L[i]}")
print()
print("=== POOLS 1183-1202 ===")
for i in range(1182, 1202):
    print(f"{i+1:5}: {L[i]}")