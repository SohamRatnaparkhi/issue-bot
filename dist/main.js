"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.run = void 0;
const core = __importStar(require("@actions/core"));
const core_1 = require("@actions/core");
const github_1 = require("@actions/github");
/**
 * The main function for the action.
 * @returns {Promise<void>} Resolves when the action is complete.
 */
// type GithubContext = typeof context
async function run() {
    try {
        // const ms: string = core.getInput('milliseconds')
        // // Debug logs are only output if the `ACTIONS_STEP_DEBUG` secret is true
        // core.debug(`Waiting ${ms} milliseconds ...`)
        // // Log the current timestamp, wait, then log the new timestamp
        // core.debug(new Date().toTimeString())
        // await wait(parseInt(ms, 10))
        // core.debug(new Date().toTimeString())
        // // Set outputs for other workflow steps to use
        // core.setOutput('time', new Date().toTimeString())
        // Get the inputs from the workflow file
        console.log('staring the action');
        core.debug('staring the action');
        const token = (0, core_1.getInput)('gh-token');
        console.log(github_1.context);
        const octokit = (0, github_1.getOctokit)(token);
        if (octokit == null) {
            throw new Error('Unable to get octokit');
        }
        console.log('octokit is here');
        core.debug('octokit is here');
        if (github_1.context.eventName === 'issue_comment') {
            const issueNumber = github_1.context.payload.issue?.number;
            const commenterId = github_1.context.payload['comment']?.['user']?.['login'] ?? '';
            const commentBody = github_1.context.payload['comment']?.['body'] ?? '';
            if (issueNumber == null) {
                throw new Error('Issue number is not defined');
            }
            const res = await octokit.rest.issues.createComment({
                owner: github_1.context.repo.owner,
                repo: github_1.context.repo.repo,
                issue_number: issueNumber,
                body: `Hello @${commenterId}, you said: ${commentBody} on issue #${issueNumber}!`
            });
            core.debug(`Response from creating comment: ${JSON.stringify(res)}`);
        }
    }
    catch (error) {
        // Fail the workflow run if an error occurs
        if (error instanceof Error)
            core.setFailed(error.message);
    }
}
exports.run = run;
//# sourceMappingURL=main.js.map