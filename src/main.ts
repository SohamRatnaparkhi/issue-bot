import * as core from '@actions/core'
import { getInput } from '@actions/core'
import { context, getOctokit } from '@actions/github'

/**
 * The main function for the action.
 * @returns {Promise<void>} Resolves when the action is complete.
 */

// type GithubContext = typeof context

export async function run(): Promise<void> {
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
    console.log('staring the action')
    core.debug('staring the action')
    const token = getInput('gh-token')
    console.log(context)

    const octokit = getOctokit(token)
    if (octokit == null) {
      throw new Error('Unable to get octokit')
    }
    console.log('octokit is here')
    core.debug('octokit is here')

    if (context.eventName === 'issue_comment') {
      const issueNumber: number | undefined = context.payload.issue?.number
      const commenterId: string = context.payload['comment']?.['user']?.['login'] ?? ''
      const commentBody: string = context.payload['comment']?.['body'] ?? ''

      if (issueNumber == null) {
        throw new Error('Issue number is not defined')
      }

      octokit.rest.issues.createComment({
        owner: context.repo.owner,
        repo: context.repo.repo,
        issue_number: issueNumber,
        body: `Hello @${commenterId}, you said: ${commentBody} on issue #${issueNumber}!`
      })
    }
  } catch (error) {
    // Fail the workflow run if an error occurs
    if (error instanceof Error) core.setFailed(error.message)
  }
}
