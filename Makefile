export MAIN_BRANCH ?= main
export CHANGELOG ?= CHANGELOG.md

.DEFAULT_GOAL := help
.PHONY: release/prepare release/tag .check_bump_type .check_git_clean help

curVersion := $(shell node -pe "require ('$(CURDIR)/package.json').version" | sed 's/^v//')
toolsdir := $(CURDIR)/scripts

test:	## Run test suite
	npm test

build: clean	## Transpile project to JavaScript
	npm run build

clean:	## Delete build outputs for a fresh start
	@rm -rf ./dist

## Release functions =====================

release/prepare: .check_git_clean	## Bumps version and creates release branch (call with 'release/prepare bump=[major|minor|patch]')
	@if ! test $(findstring ${bump}, "major minor patch"); then \
  		echo "[ERROR] The 'bump' argument must be one of: major | minor | patch"; exit 1; \
	fi

	@echo "Bumping package version..."
	$(eval newVersion="$(shell npm --no-git-tag-version version ${bump})")
	@NEW_VERSION=$(newVersion) $(toolsdir)/prepare-release.sh


release/tag: .check_git_clean	## Creates git tag using version from package.json
	@git checkout $(MAIN_BRANCH)
	@git pull --ff-only
	@echo "Applying tag 'v$(curVersion)' to HEAD..."
	@git tag --sign "v$(curVersion)" -m "Release v$(curVersion)"
	@echo "[OK] Success! Remember to 'git push --tags' to remote."


help:	## Prints this help message
	@grep -E '^[\/a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-30s\033[0m %s\n", $$1, $$2}'

## Helper functions =====================

.check_git_clean:
	@status=$$(git status --porcelain); \
	if [ ! -z "$${status}" ]; then \
		echo "[ERROR] Uncommitted changes found in worktree. Address them and try again."; exit 1; \
	fi



