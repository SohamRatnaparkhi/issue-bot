import { getOctokit } from "@actions/github";
import { Commands, FilteredContext, RoleOptions } from "src/main";

export const assignIssue = async (myPermissions: RoleOptions, command: Commands, myUserName: string, filteredData: FilteredContext, octokit: ReturnType<typeof getOctokit>) => {
    // check for role
    // check if user can be assigned
    // assign user
    const {owner, repo, issueNumber} = filteredData;
    if (command == 'assign') {
        try {
            const maxAllowedAssignedIssues = myPermissions['max-assigned-issues']
            
            const {issues, prs} = await getTotalIssuesAndPrsByUserAndRepo(myUserName, owner, repo, octokit);
            console.log(`Issues assigned to me: ${issues.length}`)
            if (issues.length >= maxAllowedAssignedIssues) {
                commentOnRepo(owner, repo, issueNumber, octokit, `You have been already assigned ${issues.length} issues. Limit crossed for open issues`);
            }
    
            const maxAllowedPrs = myPermissions['max-opened-prs']
            if (prs.length >= maxAllowedPrs) {
                commentOnRepo(owner, repo, issueNumber, octokit, `You have been already assigned ${prs.length} prs. Limit crossed for assigned prs`);
            }
    
            await octokit.rest.issues.addAssignees({
                owner,
                repo,
                issue_number: issueNumber,
                assignees: [myUserName]
            })
            return true;
        } catch (error) {
            console.log(error)
            return false;
        }
    }
    else {
        const canIUnassignOthers = myPermissions['unassign-others']
        if (canIUnassignOthers){
            await octokit.rest.issues.removeAssignees({
                owner,
                repo,
                issue_number: issueNumber,
                assignees: [myUserName]
            })
            return true;
        }
        return false;
    }
}

export function commentOnRepo(owner: string, repo: string, issue_number: number, octokit: ReturnType<typeof getOctokit>, message: string) {
    octokit.rest.issues.createComment({
        owner,
        repo,
        issue_number,
        body: message
    });
}

async function getTotalIssuesAndPrsByUserAndRepo(myUsername: string, owner: string, repo: string, octokit: ReturnType<typeof getOctokit>) {
    const repoIssues = await octokit.rest.issues.listForRepo({
        owner,
        repo,
        assignee: myUsername
    })
    let prs = [];
    let issues = [];
    for (let i = 0; i < repoIssues.data.length; i++) {
        if (repoIssues.data[i].pull_request)
            prs.push(repoIssues.data[i]);
        else
            issues.push(repoIssues.data[i]);
    }
    return {
        prs,
        issues
    }
}

