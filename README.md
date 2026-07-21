# aiFinancePlatform backup recovery

This snapshot now has a supported local boundary: the Express backend serves a
small same-origin UI from `web/`. The empty `frontend` Git link is retained only
as historical metadata and is no longer required by the launcher.

## Safe local setup

1. Copy `.env.example` to `.env` and provide new local values.
2. Review and install the locked backend dependencies explicitly.
3. Run Prisma generation/migrations as a separate, reviewed operation.
4. Run `./start.sh` to start only the backend/UI. The launcher never installs,
   kills processes, changes schema, or seeds data.

Legacy credential files were removed from the worktree. Any values they held
must be considered exposed: rotate them and clean Git history separately after
an owner confirms retention requirements.

This remains a prototype. It is not approved for investment, lending, credit,
fraud, or other regulated financial decisions.
