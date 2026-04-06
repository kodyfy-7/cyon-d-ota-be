// const { App, ExpressReceiver } = require('@slack/bolt'); // Make sure ExpressReceiver is imported
// const axios = require('axios');

// const slackApp = new App({
//   signingSecret: process.env.SLACK_SIGNING_SECRET,
//   token: process.env.SLACK_BOT_TOKEN,
//   // THIS IS CRUCIAL: Configure the receiver
//   receiver: new ExpressReceiver({
//     signingSecret: process.env.SLACK_SIGNING_SECRET,
//     // This `endpoints` path MUST exactly match the path in app.use() in app.js
//     // and the Request URL you set in Slack's app configuration.
//     endpoints: '/api/slack/interactions'
//   })
// });

// // Handle URL verification event (important for initial setup with Slack)
// slackApp.event('url_verification', async ({ event, ack }) => {
//   console.log('Received url_verification event:', event);
//   ack(); // Acknowledge the URL verification challenge
//   console.log('URL verification acknowledged.'); // Add a log for confirmation
// });

// // Handle button actions
// slackApp.action('approve_request', async ({ body, ack, client }) => {
//   console.log('Approve action received:', JSON.stringify(body, null, 2));
//   await ack();
//   const payload = JSON.parse(body.actions[0].value);
//   await handleSlackApproval(payload, body, client);
// });

// slackApp.action('reject_request', async ({ body, ack, client }) => {
//   console.log('Reject action received:', JSON.stringify(body, null, 2));
//   await ack();
//   const payload = JSON.parse(body.actions[0].value);
//   await handleSlackApproval(payload, body, client);
// });

// async function handleSlackApproval(payload, body, client) {
//   const { approvalId, requestId, step, otp, action } = payload;
//   const baseUrl = process.env.APPROVAL_BASE_URL;

//   try {
//     console.log('Calling handleApprovalAction with:', { approvalId, requestId, step, otp, action });
//     const response = await axios.post(`${baseUrl}/api/v1/admin/workflow-requests/${requestId}/approvals/${approvalId}`, {
//       action,
//       comment: `Action via Slack by ${body.user.name}`,
//       baseUrl,
//       otp
//     });

//     await client.chat.update({
//       channel: body.channel.id,
//       ts: body.message.ts,
//       text: `Request ${action} by ${body.user.name}`,
//       blocks: [
//         {
//           type: "section",
//           text: {
//             type: "mrkdwn",
//             text: `Request *${action}* by ${body.user.name}`
//           }
//         }
//       ]
//     });
//   } catch (error) {
//     console.error('Error processing Slack approval:', error.message, error.response?.data);
//     await client.chat.postMessage({
//       channel: body.channel.id,
//       text: `Error processing your ${action} action. Please try again or contact support.`
//     });
//   }
// }

// // Log all incoming events for debugging (ensure this is still active)
// slackApp.use(async ({ body, next }) => {
//   console.log('Raw incoming Slack payload (from slackApp.use):', JSON.stringify(body, null, 2));
//   await next();
// });

// // Catch unhandled events (helps debug if events aren't matched by listeners)
// slackApp.event(/.*/, async ({ event, context }) => {
//   console.log('Unhandled event received (from slackApp.event):', JSON.stringify(event, null, 2));
// });

// module.exports = { slackApp }; // Export the slackApp instance

// app/services/slack.js
// const { App, ExpressReceiver } = require('@slack/bolt');

// // Initialize receiver
// const receiver = new ExpressReceiver({
//   signingSecret: process.env.SLACK_SIGNING_SECRET,
// });

// // Create Slack app
// const slackApp = new App({
//   token: process.env.SLACK_BOT_TOKEN,
//   signingSecret: process.env.SLACK_SIGNING_SECRET,
//   receiver,
// });

// // Log all incoming events
// slackApp.use(async ({ event, next }) => {
//   console.log('📥 Bolt Middleware - Event Type:', event?.type);
//   console.log('Event Payload:', JSON.stringify(event, null, 2));
//   await next();
// });

// // Handle URL verification (Slack handshake)
// // slackApp.event('url_verification', async ({ event, ack }) => {
// //   console.log('✅ URL Verification:', event);
// //   ack(event.challenge);
// // });

// slackApp.event('url_verification', async ({ event, ack }) => {
//   console.log('✅ URL Verification Event:', JSON.stringify(event, null, 2));
//   try {
//     await ack(event.challenge);
//     console.log('✅ URL Verification Ack Sent:', event.challenge);
//   } catch (error) {
//     console.error('❌ URL Verification Ack Failed:', error);
//   }
// });

// // Handle block_actions (e.g., button clicks)
// slackApp.action('approve_request', async ({ body, ack, client }) => {
//   console.log('✅ approve_request triggered');
//   await ack();
//   console.log('Action Body:', JSON.stringify(body, null, 2));
//   // Your logic here
// });

// slackApp.action('reject_request', async ({ body, ack, client }) => {
//   console.log('❌ reject_request triggered');
//   await ack();
//   console.log('Action Body:', JSON.stringify(body, null, 2));
//   // Your logic here
// });

// module.exports = { slackApp, receiver };

// working
// const { App, ExpressReceiver, LogLevel } = require('@slack/bolt');

// const receiver = new ExpressReceiver({
//   signingSecret: process.env.SLACK_SIGNING_SECRET,
// });

// const slackApp = new App({
//   token: process.env.SLACK_BOT_TOKEN,
//   signingSecret: process.env.SLACK_SIGNING_SECRET,
//   receiver,
//   logLevel: LogLevel.DEBUG,
// });

// slackApp.event('url_verification', async ({ event, ack }) => {
//   console.log('✅ URL Verification Event:', JSON.stringify(event, null, 2));
//   try {
//     await ack(event.challenge);
//     console.log('✅ URL Verification Response Sent:', event.challenge);
//   } catch (error) {
//     console.error('❌ URL Verification Failed:', error);
//   }
// });

// slackApp.action('approve_request', async ({ body, ack, client }) => {
//   console.log('✅ approve_request triggered');
//   await ack();
//   console.log('Action Body:', JSON.stringify(body, null, 2));
// });

// slackApp.action('reject_request', async ({ body, ack, client }) => {
//   console.log('❌ reject_request triggered');
//   await ack();
//   console.log('Action Body:', JSON.stringify(body, null, 2));
// });

// module.exports = { slackApp, receiver };