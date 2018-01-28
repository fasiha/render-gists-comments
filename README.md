GitHub doesn't notify you when people leave comments on your gists. As they say in anime, めんどくさい. This module/script fetches all a given user's gists, and each gist's comments, and renders them as Markdown, putting the most recent activity first. Maybe run this once a week… or sign up for https://giscus.co/.

**Usage**
- Install [Node.js](https://nodejs.org/en/) and [Git](https://git-scm.com/).
- Then clone this repository to your computer: `$ git clone https://github.com/fasiha/render-gists-comments.git`
- Enter the directory you cloned: `$ cd render-gists-comments`
- Install Node dependencies: `$ npm install`
- Get a GitHub authorization token: go to https://github.com/settings/tokens/new and add a meaningful description (“comments”?), scroll down and click “Generate token”, and copy the alphanumeric string they give you. (GitHub will let you make sixty requests per hour without a token, but I didn't have time to catch the case where you exceed your limit, so this code just requires a token.)
- Run: `$ node index.js USERNAME TOKEN`

This will
1. print out a condensed Markdown report of comments that have been left on the user's gists, and
2. spit out two files, `gists.json` and `comments.json`, so if you want to customize your report, you can start with these.

**License** Unlicense. Go forth and be happy.