jm target add <name> <kind> <root>     # kind = fs | jsonl | sqlite ; root must EXIST
jm index @<name> --name <index>        # or: jm index <dir> --name <index>
jm index --in a,b --name both          # several targets into ONE index, rows namespaced
