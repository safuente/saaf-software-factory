---
run: RUN-0000-00-00-1
ideas_evaluated: 0
passed: 0                   # ideas with no knockout and score >= threshold
ranking: []                 # passed idea ids, best first, e.g. [IDEA-3, IDEA-1]
selected: none              # idea id written as a brief, or none
project: none               # projects/<id>-<name>, or none
---

<!--
Validator output, at runs/<run>/validation.md.
Scores are 1-5. A score above 3 requires at least two independent sources that the Validator opened itself.
Remove these comments in real files.
-->

# Validation: <run id>

## Summary
| Idea | Knockouts | Score | Result |
|---|---|---|---|
| IDEA-1 | none | 3.8 | pass |
| IDEA-2 | regulated domain | n/a | rejected |

## IDEA-1: <short name>

### Evidence check
<!-- Every source from the Scout: does it say what the Scout claims? -->
| Source | Confirmed | Note |
|---|---|---|
| <URL> | yes / partly / no / unreachable | |

### Competition search
<!-- Your own searches for existing solutions. The Scout's list is not enough. -->
| Competitor | Price | Notes | Source |
|---|---|---|---|

### Knockout criteria
| Criterion | Result | Reason |
|---|---|---|
| Buildable with the factory stack | pass / fail | |
| MVP fits in the feature limit | pass / fail | |
| Not a regulated or sensitive domain | pass / fail | |
| No paid external services, partners or third-party accounts required | pass / fail | |
| Demonstrable locally with synthetic data | pass / fail | |
| Not a clone of a specific existing product | pass / fail | |

### Scores
| Criterion | Weight | Score | Evidence |
|---|---|---|---|
| Problem severity | 3 | | |
| Audience size and frequency | 2 | | |
| Willingness to pay | 3 | | |
| Competition gap | 2 | | |
| **Weighted score** | | **x.x** | |

### Strongest argument against
<!-- The best reason this idea fails. Required for every idea. -->

### Result
pass / rejected: <reason>
