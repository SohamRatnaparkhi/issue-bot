"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.commentOnRepo = exports.assignOrUnassignIssue = void 0;
const assignOrUnassignIssue = async (myPermissions, command, myUserName, filteredData, octokit) => {
    // check for role
    // check if user can be assigned
    // assign user
    const { owner, repo, issueNumber } = filteredData;
    if (command == 'assign') {
        try {
            const maxAllowedAssignedIssues = myPermissions['max-assigned-issues'];
            const { issues, prs } = await getTotalIssuesAndPrsByUserAndRepo(myUserName, owner, repo, octokit);
            console.log(`Issues assigned to me: ${issues.length}`);
            if (issues.length >= maxAllowedAssignedIssues) {
                commentOnRepo(owner, repo, issueNumber, octokit, `You have been already assigned ${issues.length} issues. Limit crossed for open issues`);
            }
            const maxAllowedPrs = myPermissions['max-opened-prs'];
            if (prs.length >= maxAllowedPrs) {
                commentOnRepo(owner, repo, issueNumber, octokit, `You have been already assigned ${prs.length} prs. Limit crossed for assigned prs`);
            }
            await octokit.rest.issues.addAssignees({
                owner,
                repo,
                issue_number: issueNumber,
                assignees: [myUserName]
            });
            commentOnRepo(owner, repo, issueNumber, octokit, `@${myUserName}, you have been assigned to the issue`);
            return true;
        }
        catch (error) {
            console.log(error);
            return false;
        }
    }
    else {
        const canIUnassignOthers = myPermissions['unassign-others'];
        if (canIUnassignOthers) {
            await octokit.rest.issues.removeAssignees({
                owner,
                repo,
                issue_number: issueNumber,
                assignees: [myUserName]
            });
            return true;
        }
        return false;
    }
};
exports.assignOrUnassignIssue = assignOrUnassignIssue;
function commentOnRepo(owner, repo, issue_number, octokit, message) {
    octokit.rest.issues.createComment({
        owner,
        repo,
        issue_number,
        body: message
    });
}
exports.commentOnRepo = commentOnRepo;
async function getTotalIssuesAndPrsByUserAndRepo(myUsername, owner, repo, octokit) {
    const repoIssuesAndPrs = await octokit.rest.issues.listForRepo({
        owner,
        repo,
        assignee: myUsername
    });
    let prs = [];
    let issues = [];
    for (let i = 0; i < repoIssuesAndPrs.data.length; i++) {
        if (repoIssuesAndPrs.data[i].closed_at == null) {
            if (repoIssuesAndPrs.data[i].pull_request)
                prs.push(repoIssuesAndPrs.data[i]);
            else
                issues.push(repoIssuesAndPrs.data[i]);
        }
    }
    return {
        prs,
        issues
    };
}
//# sourceMappingURL=role.js.map