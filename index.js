'use strict';

const fetch = require('node-fetch');
const fs = require('fs');
const promisify = require('util').promisify;
const accessAsync = promisify(fs.access);

function usage() {
  console.error(`USAGE:
$ node index.js USERNAME GITHUB_TOKEN (see https://github.com/settings/tokens/new)
OR
$ node index.js GISTS.JSON COMMENTS.JSON`);
}

// Given a GitHub v3 API endpoint URL and an access token, this function sequentially requests all pages of the results
// and returns them as a promise.
async function githubPaginatedFetch(url, token) {
  let res = await fetch(url, token ? {headers: {'Authorization': `token ${token}`}} : {});
  let hits = await res.json();
  let links = res.headers._headers.link;
  while (links && links.find(s => s.indexOf('rel="next"') >= 0)) {
    const linkfull = links.find(s => s.indexOf('rel="next"') >= 0);
    const link = linkfull.match(/<([^>]+)>;\s*rel=.next./)[1];
    res = await fetch(link);
    hits = hits.concat(await res.json());
    links = res.headers._headers.link;
  }
  return hits;
}

// This function gets all the gists and comments for each gist.
async function getGistsAndComments(username, token) {
  const gists = await githubPaginatedFetch(`https://api.github.com/users/${username}/gists`, token);
  console.log('Fetched gists:', gists.length);
  const comments = await Promise.all(
      gists.map(obj => githubPaginatedFetch(`https://api.github.com/gists/${obj.id}/comments`, token)));
  console.log('Fetched comments:', comments.length);
  return {gists, comments};
}

// Given two arrays, of gists and comments on each gist, this function renders some markdown, displaying the latest
// comments first.
function render(gists, comments) {
  if (gists.length !== comments.length) { throw new Error('Found a different number of gists vs comments objects'); }

  let idxs = Array.from(Array(gists.length), (_, k) => k); // [0, ..., gists.length - 1]
  const commentToDate = comment => new Date(comment.created_at);
  const commentsToNewest = comments => comments.length ? Math.max(...comments.map(commentToDate)) : 0;
  idxs.sort((a, b) => -(commentsToNewest(comments[a]) - commentsToNewest(comments[b])));
  // sort newest comments to oldest, so we can rerun and see what's new at the top.

  let sections = [];
  for (let unsortedi = 0; unsortedi < gists.length; unsortedi++) {
    const i = idxs[unsortedi];
    if (comments[i].length) {
      const section = `# [${gists[i].description}](${gists[i].html_url})\n`;
      const body = comments[i].map(c => `## ${c.user.login} (${c.created_at})\n${c.body.trim()}`).join('\n\n');
      sections.push(section + body);
    }
  }
  return sections.join('\n\n');
}

module.exports = {
  render,
  getGistsAndComments,
  githubPaginatedFetch
};

if (require.main === module) {
  (async function() {
    const username = process.argv[2];
    const token = process.argv[3];
    if (!username || !token) {
      usage();
      process.exit(1);
    }
    try {
      const filesExist = await Promise.all([accessAsync(username), accessAsync(token)]);
      const gists = JSON.parse(fs.readFileSync(username));
      const comments = JSON.parse(fs.readFileSync(token));
      console.log(render(gists, comments));
      process.exit(0);
    } catch (e) {
      if (e.type === 'ENOENT') {}
    }
    const {gists, comments} = await getGistsAndComments(username, token);
    console.log(`Writing ${gists.length} gists/comments to gists.json and comments.json.`);
    fs.writeFileSync('gists.json', JSON.stringify(gists));
    fs.writeFileSync('comments.json', JSON.stringify(comments));
  })()
}
