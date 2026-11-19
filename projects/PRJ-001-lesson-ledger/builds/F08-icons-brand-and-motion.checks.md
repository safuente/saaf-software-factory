---
commit: 7bac4f31a5d3771c81e5e7ae3cb5d77d024ea697
result: pass
round: 1
---
## make check
exit code 0 (second run). The first run failed only tests/test_ac2_login.py::test_login_timing_does_not_reveal_registered_emails (F01 timing test, flaky under host load); F08 changes no backend file, the test passed 3/3 alone and the full rerun passed.
```
install ok
lint ok
typecheck ok
test: backend 323 passed, 1 skipped in 49.75s, coverage 99%; frontend 462 passed, coverage 99%
build ok
scan ok
```
## make e2e
exit code 0
```
e2e: 227 passed (1.6m)
```
