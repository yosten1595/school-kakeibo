# PreToolUse hook: enforce the GitHub workflow rules in CLAUDE.md.
# Exit code 2 blocks the tool call and feeds stderr back to Claude.
$ErrorActionPreference = 'Stop'
[Console]::InputEncoding = [Text.Encoding]::UTF8
[Console]::OutputEncoding = [Text.Encoding]::UTF8

$branchRe = '^(feature|fix|docs|refactor|chore|test)/[0-9]+-[a-z0-9]+(-[a-z0-9]+)*$'
$protected = @('main', 'master')

function Block($msg) {
    [Console]::Error.WriteLine("[CLAUDE.md rule violation] $msg")
    exit 2
}

try {
    $data = [Console]::In.ReadToEnd() | ConvertFrom-Json
    $command = $data.tool_input.command
} catch { exit 0 }
if (-not $command) { exit 0 }

$current = (& git rev-parse --abbrev-ref HEAD 2>$null)
if ($current) { $current = $current.Trim() }

# Check each chained statement separately.
foreach ($stmt in ($command -split '&&|\|\||;|\r?\n')) {
    $t = @($stmt.Trim() -split '\s+' | Where-Object { $_ })
    $gi = [array]::IndexOf($t, 'git')
    if ($gi -ge 0 -and $t.Count -gt $gi + 1) {
        $sub = $t[$gi + 1]
        $a = @($t | Select-Object -Skip ($gi + 2))

        if ($sub -eq 'commit' -and $protected -contains $current) {
            Block "Direct commits to $current are forbidden. Create an Issue and a work branch first."
        }

        if ($sub -eq 'push') {
            if ($a | Where-Object { $_ -match '^(-f|-d|--force.*|--mirror|--delete)$' }) {
                Block 'force push / branch-deleting push is forbidden.'
            }
            $pos = @($a | Where-Object { $_ -notmatch '^-' })
            $refs = @($pos | Select-Object -Skip 1)
            $hit = $false
            foreach ($r in $refs) {
                $parts = ($r -replace '^\+', '') -split ':'
                $dst = ($parts[-1] -replace '^refs/heads/', '')
                if ($protected -contains $dst -or $protected -contains $parts[0]) { $hit = $true }
            }
            if ($hit -or ($refs.Count -eq 0 -and $protected -contains $current)) {
                Block 'Direct push to main/master is forbidden. Go through a PR.'
            }
        }

        $new = $null
        if ($sub -in 'checkout', 'switch') {
            $i = [array]::FindIndex($a, [Predicate[string]] { param($x) $x -in '-b', '-B', '-c', '-C' })
            if ($i -ge 0 -and $i + 1 -lt $a.Count) { $new = $a[$i + 1] }
        } elseif ($sub -eq 'branch') {
            $pos = @($a | Where-Object { $_ -notmatch '^-' })
            $skip = $a | Where-Object { $_ -match '^(-[dDmMcClarv]|--(delete|move|copy|list|show-current|merged|no-merged|contains|no-contains|points-at|sort|format)(=.*)?)$' }
            if (-not $skip -and $pos.Count -gt 0) { $new = $pos[0] }
        }
        if ($new -and $new -notmatch $branchRe) {
            Block "Branch name '$new' violates the naming rule. Use <type>/<issue-number>-<kebab-case> (e.g. feature/12-add-task-sort). Create the Issue first to get its number."
        }
    }

    if ($stmt -match '\bgh\s+pr\s+create\b' -and $stmt -notmatch '(?i)\b(closes|fixes|resolves|refs)\s+#[0-9]+') {
        Block 'PR body must reference an Issue (e.g. Closes #12).'
    }
    if ($stmt -match '\bgh\s+pr\s+merge\b') {
        Block 'Merging PRs is done by the user, not Claude.'
    }
}
exit 0
