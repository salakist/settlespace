## Plan: Rename FoTest to SettleSpace

Perform a full technical rebrand using `SettleSpace` for product/UI naming, `settlespace` for the repo/folder slug, and a consistent `SettleSpace.*` prefix for solution/projects/namespaces. The manual/platform rename work has already been completed, so the remaining implementation is focused on finishing the in-repo code, config, docs, and script rename safely in one dedicated change set.

**Steps**
1. **Lock the naming map and current scope**
   - Product/UI name: `SettleSpace`
   - Repo/folder slug: `settlespace`
   - Frontend folder/package: `settlespace-react`
   - Recommended .NET prefix: `SettleSpace.*` for solution, projects, and namespaces
   - MongoDB database name: `settlespace`
   - Treat the previous manual/platform actions as **already completed** and do not repeat them.
   - *Blocks all later steps* — avoid mixing `SettleSpace`, `SettleSpaceApi`, and `settle-space` inconsistently.

2. **Rename solution and project structure inside the repo**
   - Rename `c:\Users\simon\Repos\settlespace\FoTestApi.sln` to `c:\Users\simon\Repos\settlespace\SettleSpace.sln`.
   - Rename backend folders/projects from `FoTestApi.Application`, `FoTestApi.Domain`, and `FoTestApi.Infrastructure` to their `SettleSpace.*` equivalents.
   - Rename mirrored test project folders/files under `c:\Users\simon\Repos\settlespace\Tests\` to match the new project names.
   - Rename `c:\Users\simon\Repos\settlespace\fotest-react\` to `c:\Users\simon\Repos\settlespace\settlespace-react\`.
   - Update all `.sln` project entries and `.csproj` `ProjectReference` paths immediately after the file/folder rename.
   - *Depends on 1.*

3. **Update .NET technical identifiers and references**
   - Replace `namespace FoTestApi...` and matching `using FoTestApi...` statements across application, domain, infrastructure, and tests.
   - Update `.csproj` metadata such as `RootNamespace`, `AssemblyName`, and `InternalsVisibleTo` values.
   - Rename internal types that still expose the old brand, especially `FoTestDatabaseSettings` and any matching test class names.
   - Review `Program.cs`, DI wiring, launch settings, and test references for string-based or type-based name assumptions.
   - *Depends on 2.*

4. **Update runtime configuration and environment identity**
   - Change `c:\Users\simon\Repos\settlespace\FoTestApi.Application\appsettings.json` and `appsettings.Development.json` values from `FoTestDatabase` / `fo-test` / `FoTestApi` / `FoTestReact` to the new `SettleSpace` names.
   - Update JWT issuer/audience strings and the placeholder JWT secret text so no old branding remains.
   - Update tests that assert the old database name or old settings class name.
   - Keep the existing Mongo collections as `persons` / `transactions` unless a separate schema change is explicitly needed.
   - *Depends on 3.*

5. **Refresh frontend branding and package identity**
   - Update `c:\Users\simon\Repos\settlespace\settlespace-react\package.json` package name and any scripts/docs that reference `fotest-react`.
   - Update `public\manifest.json`, `public\index.html`, and in-app copy such as `src\features\home\components\HomePage.tsx` so the visible product name becomes `SettleSpace`.
   - Check for any route/help text mentioning `FoTest` and remove it.
   - *Parallel with step 6 once step 2 is complete.*

6. **Update docs, scripts, hooks, and repo policy references**
   - Replace old repo/folder/project names in `c:\Users\simon\Repos\settlespace\README.md`, `AGENTS.md`, nested `AGENTS.md` files, and `plans\agent-commit-attribution.plan.md`.
   - Update script package identity in `c:\Users\simon\Repos\settlespace\scripts\package.json`.
   - Update repo-specific agent identity/help text in `scripts\setup\set-agent-git-identity.ps1`, `scripts\hooks\commit-msg`, and `scripts\hooks\pre-commit`.
   - Review any custom git config keys using the `fotest.` prefix; either rename them to `settlespace.` everywhere or temporarily support both during transition.
   - Update `sonar-project.properties` so the in-repo identifiers and paths match the already-completed external Sonar setup.
   - *Parallel with step 5 after step 2.*

7. **Run verification and cleanup**
   - Run a repo-wide search for `FoTestApi|FoTest|fo-test|fotest` and reduce expected matches to zero, excluding old generated artifacts if needed.
   - Clean stale `bin/`, `obj/`, coverage, and frontend build outputs so old assembly names do not mask issues.
   - Verify the renamed solution builds/tests pass and the app starts with the new branding in both backend and frontend.
   - Run the **full-base** quality gate at the end of the rename, rather than the incremental/new-code gate.
   - *Depends on 3 through 6.*

8. **Post-rename confirmation only**
   - Do not repeat the already-completed GitHub/local-folder/manual platform actions.
   - Confirm that the existing GitHub/Sonar/Mongo bindings still work after the in-repo rename lands.
   - Package the entire rename as **one dedicated commit/PR** after step 7 passes.
   - *Can be done after step 7.*

**Relevant files**
- `c:\Users\simon\Repos\settlespace\FoTestApi.sln` — current solution file that still needs renaming
- `c:\Users\simon\Repos\settlespace\FoTestApi.Application\FoTestApi.Application.csproj` — project identity, references, namespace defaults
- `c:\Users\simon\Repos\settlespace\FoTestApi.Domain\FoTestApi.Domain.csproj` — project identity
- `c:\Users\simon\Repos\settlespace\FoTestApi.Infrastructure\FoTestApi.Infrastructure.csproj` — project identity and `InternalsVisibleTo`
- `c:\Users\simon\Repos\settlespace\Tests\FoTestApi.Application.Tests\FoTestApi.Application.Tests.csproj` — mirrored test references
- `c:\Users\simon\Repos\settlespace\Tests\FoTestApi.Domain.Tests\FoTestApi.Domain.Tests.csproj` — mirrored test references
- `c:\Users\simon\Repos\settlespace\Tests\FoTestApi.Infrastructure.Tests\FoTestApi.Infrastructure.Tests.csproj` — mirrored test references
- `c:\Users\simon\Repos\settlespace\FoTestApi.Infrastructure\FoTestDatabaseSettings.cs` — rename settings type to remove old branding
- `c:\Users\simon\Repos\settlespace\FoTestApi.Application\appsettings.json` — DB/Auth naming
- `c:\Users\simon\Repos\settlespace\FoTestApi.Application\appsettings.Development.json` — DB/Auth naming
- `c:\Users\simon\Repos\settlespace\sonar-project.properties` — Sonar project key and frontend paths
- `c:\Users\simon\Repos\settlespace\fotest-react\package.json` — current frontend package name
- `c:\Users\simon\Repos\settlespace\fotest-react\public\manifest.json` — display name/short name
- `c:\Users\simon\Repos\settlespace\fotest-react\src\features\home\components\HomePage.tsx` — visible product copy
- `c:\Users\simon\Repos\settlespace\README.md` — clone/run/setup/docs references
- `c:\Users\simon\Repos\settlespace\AGENTS.md` — repo structure and command references
- `c:\Users\simon\Repos\settlespace\scripts\package.json` — scripts package identity
- `c:\Users\simon\Repos\settlespace\scripts\setup\set-agent-git-identity.ps1` — default agent name/email text
- `c:\Users\simon\Repos\settlespace\scripts\hooks\commit-msg` — repo identity fallback text
- `c:\Users\simon\Repos\settlespace\scripts\hooks\pre-commit` — repo name/help text

**Verification**
1. Repo-wide text search: confirm no remaining tracked references to `FoTestApi`, `FoTest`, `fo-test`, or `fotest` outside intentionally historical notes or generated artifacts.
2. Backend build: before the solution rename, `dotnet build FoTestApi.sln`; after the rename, `dotnet build SettleSpace.sln`.
3. Automated tests: after the rename, `dotnet test SettleSpace.sln`.
4. Frontend tests: from `settlespace-react`, run `npm run test:ci`.
5. Quality gate: run the **full-base** gate/debug wrapper at the end of the rename work after all script/path updates are in place.
6. Manual runtime smoke test: launch the API and frontend, then verify login/register, persons CRUD, transactions CRUD/search, profile updates/password change, and the debts placeholder page all load under the new branding.
7. External verification: confirm the already-renamed GitHub/Sonar/Mongo setup still matches the in-repo identifiers.

**Decisions**
- Manual/external platform actions are already complete and are not part of the remaining execution scope.
- Included in scope: solution/projects/namespaces, runtime config, docs, scripts, Sonar config, frontend folder/package, and MongoDB database naming.
- Recommended naming standard: `SettleSpace` for product/UI, `settlespace` for filesystem/repo slug, and `SettleSpace.*` for .NET technical names.
- Recommended data approach: keep existing collection names (`persons`, `transactions`) and migrate only the database name to reduce risk.
- Out of scope: changing business behavior, adding new features, or redesigning the app structure beyond the rename.

**Further Considerations**
1. Prefer one dedicated rename PR/commit with no feature work mixed in; that makes build breaks and review much easier to isolate.
2. Because the root folder has already been renamed, prioritize path and script updates early so local commands stay accurate throughout the change.
3. Treat GitHub/Sonar verification as a final confirmation step rather than a separate manual rename phase.