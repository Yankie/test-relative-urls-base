const eleventyNavigationPlugin = require("@11ty/eleventy-navigation");
const eleventyFilterRelativeUrl = require('eleventy-filter-relative-url');
const eleventyPluginTOC = require('eleventy-plugin-toc');
const directoryOutputPlugin = require("@11ty/eleventy-plugin-directory-output");
const posthtml = require('posthtml');
const urls = require('posthtml-urls');
const path = require('node:path');
const url = require('node:url');
// const {isAbsoluteUrl} = require('is-absolute-url');

module.exports = function(eleventyConfig) {
  eleventyConfig.setDataDeepMerge(true);
  
  eleventyConfig.addWatchTarget("./src/_assets/")
  eleventyConfig.addPassthroughCopy({"./src/_assets/":"/assets"})
  eleventyConfig.addWatchTarget("./src/content/media/")
  eleventyConfig.addPassthroughCopy({"./src/content/media/":"/media"})

  // Filter to make all paths relative
  eleventyConfig.addFilter('url', eleventyFilterRelativeUrl);

  eleventyConfig.addPlugin(eleventyNavigationPlugin);
  eleventyConfig.addPlugin(eleventyPluginTOC)

  eleventyConfig.addCollection("allPathSorted", function (collectionApi) {
		return collectionApi.getAll().sort(function (a, b) {
			return a.inputPath.localeCompare(b.inputPath); // sort by path - ascending
		});
	});
  
  eleventyConfig.setQuietMode(true);
	eleventyConfig.addPlugin(directoryOutputPlugin);

  let markdownIt = require("markdown-it");
  let markdownLibrary = markdownIt({
    html: true,
    breaks: false,
    linkify: true,
    typographer: true,
    quotes: '«»„“'
  });
  // markdownLibrary.disable(['replacements']); //: {'replace_scoped'}

  /* Markdown Plugins */
  markdownLibrary.use(require("markdown-it-anchor"), {
    level: [2, 3, 4],
    permalink: false,
  });
  markdownLibrary.use(require("markdown-it-toc-done-right"), { level: [2,3,4] });

  eleventyConfig.setLibrary("md", markdownLibrary);
  let contentMap = null;
  // Async-friendly
  eleventyConfig.on("eleventy.contentMap", async (data) => {
    // inputPathToUrl is an object mapping input file paths to output URLs
    // urlToInputPath is an object mapping output URLs to input file paths
    console.log("in event: ", data)
    contentMap = {
      inputPathToUrl: data.inputPathToUrl,
      urlToInputPath: data.urlToInputPath
    }
  });
  
  // console.log("in config: ", contentMap);
  
  let inputDir;
  let outputDir;
  eleventyConfig.on("eleventy.directories", function ({ input, output }) {
    inputDir = (!input.startsWith('.') ? './'+input : input);
    outputDir = (!output.startsWith('.') ? './'+output : output);
  });
  
  eleventyConfig.addTransform("relativeUrlTransform", async function (content) {
    if (!contentMap) {
      throw new Error("Internal error: contentMap not available for `relativeUrlTransform` Transform.");
    }

    let srcData = this;
    let srcFileDir = path.dirname(this.page.inputPath);
    let srcUrl = contentMap.inputPathToUrl[this.page.inputPath][0];
    let modifier = posthtml().use(
      urls({
        eachURL: function (url) {

          // return if starts with `#`
          if(url.startsWith("#")) { return url }
          // return if absolute URL
          if(isAbsoluteUrl(url)) { return url }

          // normalize given path
          const normalizedUrl = path.normalize(url);
          //resolve url to inputDir

          const fullUrl = './'+path.join(inputDir, (path.isAbsolute(normalizedUrl) ? normalizedUrl : path.join(srcFileDir, normalizedUrl)))

          const cmRelativeUrl = contentMap.inputPathToUrl[fullUrl]? function (url) { return url.endsWith('/') ? url+'index.html':url}(contentMap.inputPathToUrl[fullUrl][0]) : normalizedUrl
          const relativeUrl = path.relative(srcUrl, cmRelativeUrl)
          

          // path.relative(inputDir, path.isAbsolute(normalizedUrl) ? '.'+normalizedUrl : normalizedUrl);
          console.log(
            {
              inputDir: inputDir,
          //     outputDir: outputDir,
          //     srcData: srcData,
          //     CM: contentMap.inputPathToUrl,
          //     srcFileDir: srcFileDir,
              srcUrl: srcUrl,
              url: url,
              normUrl: normalizedUrl,
              fullUrl: fullUrl,
          //     CMurl: contentMap.inputPathToUrl[fullUrl],
              relativeUrl:  relativeUrl
            }
          )

          return !!relativeUrl.endsWith(path.delimiter) ? relativeUrl+'index.html' : relativeUrl;
        },
      })
    );
  
    let result = await modifier.process(content, {});
    return result.html;

		// console.log("in transformer: ",  this, inputDir/*, contentMap, result.html*/);
		// console.log("in transformer: ", contentMap)

		// return content; // no changes made.
	});
  return {
    templateFormats: ["md", "njk", "html"],
    pathPrefix: "./",
    markdownTemplateEngine: "njk",
    htmlTemplateEngine: "njk",
    dataTemplateEngine: "njk",
    dir: {
      input: "src/content/pages",
      data: "../../_data",
      layouts: "../../_layouts",
      includes: "../../_includes",
      output: "_site"
    },
  }
}
// Scheme: https://tools.ietf.org/html/rfc3986#section-3.1
// Absolute URL: https://tools.ietf.org/html/rfc3986#section-4.3
const ABSOLUTE_URL_REGEX = /^[a-zA-Z][a-zA-Z\d+\-.]*?:/;

// Windows paths like `c:\`
const WINDOWS_PATH_REGEX = /^[a-zA-Z]:\\/;

function isAbsoluteUrl(url) {
	if (typeof url !== 'string') {
		throw new TypeError(`Expected a \`string\`, got \`${typeof url}\``);
	}

	if (WINDOWS_PATH_REGEX.test(url)) {
		return false;
	}

	return ABSOLUTE_URL_REGEX.test(url);
}

