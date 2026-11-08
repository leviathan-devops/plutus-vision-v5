import importlib
for m in ("PIL", "matplotlib"):
    try:
        mod = importlib.import_module(m)
        print(f"  YES {m} {getattr(mod, '__version__', '?')}")
    except Exception as e:
        print(f"  no  {m}")
