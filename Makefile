export SRCDIR := $(CURDIR)
export CUR_VERSION := $(shell node -pe "require ('$(SRCDIR)/package.json').version" | sed 's/^v//')

MAIN_BRANCH ?= main
# skip creating a new commit and git tag
VERSION_ARGS = --no-git-tag-version

release/prepare/%: _check_git_clean ## Bumps version and creates release branch
	$(git fetch origin $(MAIN_BRANCH))

	@echo "Bumping package version..."
	$(eval NEW_VERSION="$(shell npm $(VERSION_ARGS) version $*)")
	@NEW_VERSION=$(NEW_VERSION) ./scripts/prepare-release.sh


.PHONY: release/tag
release/tag: ## Creates git tag using version from package.json
	@git checkout $(MAIN_BRANCH)
	@git pull --ff-only
	@echo "Applying tag 'v$(CUR_VERSION)' to HEAD..."
	@git tag --sign "v$(CUR_VERSION)" -m "Release v$(CUR_VERSION)"
	@echo "[OK] Success!"
	@echo "Remember to 'git push --tags' to remote."


.PHONY: _check_git_clean
_check_git_clean:
	@status=$$(git status --porcelain); \
	if [ ! -z "$${status}" ]; \
	then \
		echo "Error - Uncommitted changes found in worktree. Address them and try again."; \
		exit 1; \
	fi
