#!/usr/bin/env bash
#
# prepare-release.sh:
# Creates a branch using the provided version value
# and prepares changelog for a new release.
##############################################
set -Eeuo pipefail

trap 'errorAndExit Command failed: ${BASH_COMMAND}' ERR
function errorAndExit() {
    echo "[ERROR] $*" >&2
    exit 1
}

if [[ -z "${NEW_VERSION:-}" ]]; then
    errorAndExit "NEW_VERSION environment variable not defined."
    exit 1
fi

# Script called from within a git repo?
if [[ $(git rev-parse --is-inside-work-tree &>/dev/null) -ne 0 ]]; then
    errorAndExit "Current directory is not a git repository" >&2
    exit 1
fi

# Get root of repository and set to working directory
REPO_ROOT=$(git rev-parse --show-toplevel)
MAIN_BRANCH="main"
RELEASE_BRANCH=$(printf "release/%s" "${NEW_VERSION}")
CHANGELOG="CHANGELOG.md"

# Update or create the changelog file. It prepends a template block to the top of the file.
# The user should fill out the template and commit the changes.
function updateChangelog() {
    local tmpfile

    trap '[ -e "${tmpfile}" ] && rm "${tmpfile}"' RETURN

    local changelogFile
    changelogFile=$(printf "%s/%s" "${REPO_ROOT}" "${CHANGELOG}")

    # create Changelog file if not exists
    if ! [[ -f "${REPO_ROOT}/${CHANGELOG}" ]]; then
        touch -a "${REPO_ROOT}/${CHANGELOG}"
    fi

    tmpfile=$(mktemp)

    # Replace "Latest" in the top-most changelog block with new version
    # Then push a new "latest" block to top of the changelog
    awk \
     'NR==1,/---/{sub(/START\/LATEST/, "START/'${NEW_VERSION}'");sub(/# Latest/, "# '${NEW_VERSION}'") } {print}' \
     "${changelogFile}" > "${tmpfile}"

    cat - "${tmpfile}" << EOF > "${REPO_ROOT}/${CHANGELOG}"
[//]: # (START/LATEST)
# Latest

## Features:
  * A user-friendly description of the new feature. {issue-number}

## Fixes:
 * A user-friendly description of the new fix. {issue-number}

## Security:
 * A user-friendly description of the security fix. {issue-number}

---

EOF
}

function _main() {

    if ! git checkout -b "${RELEASE_BRANCH}" origin/"${MAIN_BRANCH}" &>/dev/null; then
        errorAndExit "Release branch not created. Reset current branch before retrying."
    fi

    updateChangelog

    cat << EOF
[SUCCESS] Version successfully bumped:
    New Version:    ${NEW_VERSION}
    Release Branch: ${RELEASE_BRANCH}

Next steps:
  1. Edit the changelog notes at the top of ${CHANGELOG}
  2. Commit changes to the release branch
  3. Push changes and open a PR for review.

EOF
    exit 0
}

_main
