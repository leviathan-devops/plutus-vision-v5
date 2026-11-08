job: fence
seat: plutus-vision-lqz
mission: e1-e2-verbatim-per-prompt-v533-five-zones
steps:
  - id: step-0-battery
    artifact: /home/leviathan/JARVIS_WORKSPACE/Shared_Workspace/PLUTUS_VISION/.fence/step-0.txt
    done-when:
      - python3 scripts/e1_st_18.py > /home/leviathan/JARVIS_WORKSPACE/Shared_Workspace/PLUTUS_VISION/.fence/step-0.txt 2>&1
  - id: step-1-e2-battery
    artifact: /home/leviathan/JARVIS_WORKSPACE/Shared_Workspace/PLUTUS_VISION/.fence/step-1.txt
    done-when:
      - python3 scripts/e2_tests.py > /home/leviathan/JARVIS_WORKSPACE/Shared_Workspace/PLUTUS_VISION/.fence/step-1.txt 2>&1
  - id: step-2-structure
    artifact: /home/leviathan/JARVIS_WORKSPACE/Shared_Workspace/PLUTUS_VISION/.fence/step-2.txt
    done-when:
      - python3 scripts/make_verify_structure.py > /home/leviathan/JARVIS_WORKSPACE/Shared_Workspace/PLUTUS_VISION/.fence/step-2.txt 2>&1
  - id: step-3-ladder
    artifact: /home/leviathan/JARVIS_WORKSPACE/Shared_Workspace/PLUTUS_VISION/.fence/step-3.txt
    done-when:
      - python3 scripts/make_verify_ladder.py > /home/leviathan/JARVIS_WORKSPACE/Shared_Workspace/PLUTUS_VISION/.fence/step-3.txt 2>&1
  - id: step-4-v1-seal
    artifact: /home/leviathan/JARVIS_WORKSPACE/Shared_Workspace/PLUTUS_VISION/.fence/step-4.txt
    done-when:
      - python3 scripts/verify_v1_seal.py > /home/leviathan/JARVIS_WORKSPACE/Shared_Workspace/PLUTUS_VISION/.fence/step-4.txt 2>&1
sha16:
  step-0-battery: 1c2f2b7529d1c501
  step-1-e2-battery: e3ecd90df492815a
  step-2-structure: e9ce44117ab65cf5
  step-3-ladder: d9286f90bfbb4978
  step-4-v1-seal: 08860c7dba094018
