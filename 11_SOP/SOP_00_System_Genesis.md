# SOP 00: System Genesis

## Rule: No Raw Data Without Causal Pillar Assignment

It is strictly forbidden to store any raw, unprocessed data or signals within the system without immediately assigning a primary `causal_pillar`.

**Reasoning:**

The core logic of Future Desk OS is to understand the causal chain of events, from intelligence to new decision systems. Uncategorized data represents noise and undermines this primary objective. Every piece of information must be contextualized within the 5-pillar model at the moment of ingestion.

**Procedure:**

1.  All ingestion scripts, manual inputs, or API connections *must* include a mandatory field for `causal_pillar`.
2.  If the pillar cannot be determined with high confidence, the data point must be rejected or flagged for immediate manual review.
3.  There is no "pending" or "uncategorized" status for the `causal_pillar` field.

This standard operating procedure ensures data integrity and maintains the analytical rigor of the entire system from the very first step.
