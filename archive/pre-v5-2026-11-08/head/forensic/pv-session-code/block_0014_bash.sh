jm query   <index> --fts "the term" --limit 50       # ranked hits, each as path#L<line>
jm query   <index> --where "size>2000"               # a numeric filter
jm scan    <index> --lex <term> --limit 50           # candidates + hit counts + excerpts
jm cluster <index> --lex <term>                      # deterministic signature groups
jm extract <index> --re '<regex>'                    # structured pulls (JSON output)
jm extract <index> --field <jsonkey>                 # one field out of each row
