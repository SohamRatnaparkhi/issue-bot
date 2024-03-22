import * as core from '@actions/core';
import { getInput } from '@actions/core';
import { context, getOctokit } from '@actions/github';
import jsYaml from 'js-yaml';
/**
 * The main function for the action.
 * @returns {Promise<void>} Resolves when the action is complete.
 */

// type GithubContext = typeof context

export async function run(): Promise<void> {
  try {
    // const ms: string = core.getInput('milliseconds')

    // // Debug logs are only output if the `ACTIONS_STEP_DEBUG` secret is true
    // console.log(`Waiting ${ms} milliseconds ...`)

    // // Log the current timestamp, wait, then log the new timestamp
    // console.log(new Date().toTimeString())
    // await wait(parseInt(ms, 10))
    // console.log(new Date().toTimeString())

    // // Set outputs for other workflow steps to use
    // core.setOutput('time', new Date().toTimeString())

    // Get the inputs from the workflow file
    console.log('staring the action')
    const token = getInput('gh-token')

    const octokit = getOctokit(token)
    if (octokit == null) {
      throw new Error('Unable to get octokit')
    }
    console.log('octokit is here')

    if (context.eventName === 'issue_comment') {
      const issueNumber: number | undefined = context.payload.issue?.number
      const commenterId: string = context.payload['comment']?.['user']?.['login'] ?? ''
      const commentBody: string = context.payload['comment']?.['body'] ?? ''

      if (issueNumber == null) {
        throw new Error('Issue number is not defined')
      }

      const res = await octokit.rest.issues.createComment({
        owner: context.repo.owner,
        repo: context.repo.repo,
        issue_number: issueNumber,
        body: `Hello @${commenterId}, you said: ${commentBody} on issue #${issueNumber}!`
      })

      // get type of comment body followed by params
      const commentBodyArgs = commentBody.split(' ')
      const command = commentBodyArgs[0] as Commands
      const participantAccountNames = commentBodyArgs.slice(1);

      console.log(command);
      console.log(participantAccountNames)

      // check repo status using labels

      const labels = await octokit.rest.issues.listLabelsOnIssue({
        owner: context.repo.owner,
        repo: context.repo.repo,
        issue_number: issueNumber
      })

      const labelNames = labels.data.map(label => label.name)

      // check if the issue has the right label
      const issueStatesInLine = getInput('issue-states-inline')
      // parse yaml string and convert to object
      const issueStates = jsYaml.load(issueStatesInLine) as Record<string, string>;

      console.log(`Issue states: ${JSON.stringify(issueStates)}`)

      const exchangeKeyValueInObject = (obj: Record<string, string>) => {
        const newObj: Record<string, string> = {}
        for (const key in obj) {
          newObj[obj[key]] = key
        }
        return newObj
      }

      const issueStatesReverse = exchangeKeyValueInObject(issueStates)
      console.log(`Issue states reverse: ${JSON.stringify(issueStatesReverse)}`)
      if (!labelNames.includes(issueStatesReverse['help-wanted'])) {
        console.log(`Issue #${issueNumber} does not have the right label`)
      }

      const roles = getInput('roles-config-inline');
      const rolesConfig = jsYaml.load(roles) as Record<string, RoleOptions>;
      console.log(`Roles config: ${JSON.stringify(rolesConfig)}`);

      // get user role
      const maintainerFilePath = getInput('maintainers-config');
      const { data } = await octokit.rest.repos.getContent({
        owner: context.repo.owner,
        repo: context.repo.repo,
        path: maintainerFilePath
      })

      const owner = context.repo.owner;
      const repo = context.repo.repo;
      const path = maintainerFilePath;
      const { data: data2 } = await octokit.request(`GET /repos/${owner}/${repo}/contents/${path}`, {
        owner: owner,
        repo: repo,
        path: path,
        headers: {
          'X-GitHub-Api-Version': '2022-11-28'
        }
      })

      const fileContent = data2.content // @ts-ignore 
      console.log(fileContent)
      const decodedContent = Buffer.from(fileContent).toString("binary")
      console.log("Parsed content")
      console.log(decodedContent)
      const parsedContent = jsYaml.load(decodedContent) as Record<string, string>
      console.log(parsedContent)
      // console.log(`Maintainers: ${JSON.stringify(parsedContent)}`)

      // check for role
      // check is user can be assigned
      // assign user

      // update label

    }
  } catch (error) {
    // Fail the workflow run if an error occurs
    if (error instanceof Error) core.setFailed(error.message)
  }
}
export type Commands = '\\assign' | '\\unassign';

export type RoleOptions = {
  "max-assigned-issues": number,
  "max-opened-issues": number,
  "unassign-others": boolean,
  "allowed-labels"?: string[],
}