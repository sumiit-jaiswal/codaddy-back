const puppeteer = require("puppeteer");

async function scrapeProblemWithBrowser(contestId, problemId) {
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  try {
    const page = await browser.newPage();

    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
    );

    const url = `https://codeforces.com/problemset/problem/${contestId}/${problemId}`;
    await page.goto(url, {
      waitUntil: "networkidle0",
      timeout: 60000,
    });

    const problemDetails = await page.evaluate(() => {
      const problemStatementElement =
        document.querySelector(".problem-statement");

      // Extract title from header
      const titleElement =
        problemStatementElement.querySelector(".header .title");
      const title = titleElement ? titleElement.textContent.trim() : null;

      const noteElement = problemStatementElement.querySelector(".note");
      const note = noteElement ? noteElement.innerHTML.trim() : "";

      // Extract problem description
      const descriptionElements = problemStatementElement.querySelectorAll(
        ":scope > div:not(.header):not(.input-specification):not(.output-specification):not(.sample-tests):not(.note)"
      );
      const problemStatement = Array.from(descriptionElements)
        .map((el) => el.innerHTML.trim())
        .filter((text) => text)
        .join("<br/><br/>");

      // Format time limit
      const timeLimitElement = document.querySelector(".time-limit");
      let timeLimit = "";
      if (timeLimitElement) {
        const timeLimitTitle =
          timeLimitElement
            .querySelector(".property-title")
            ?.textContent.trim() || "";
        const timeLimitValue = timeLimitElement.textContent
          .replace(timeLimitTitle, "")
          .trim();
        timeLimit = `Time limit per test: ${timeLimitValue}`;
      }

      // Format memory limit
      const memoryLimitElement = document.querySelector(".memory-limit");
      let memoryLimit = "";
      if (memoryLimitElement) {
        const memoryLimitTitle =
          memoryLimitElement
            .querySelector(".property-title")
            ?.textContent.trim() || "";
        const memoryLimitValue = memoryLimitElement.textContent
          .replace(memoryLimitTitle, "")
          .trim();
        memoryLimit = `Memory limit per test: ${memoryLimitValue}`;
      }

      const processContent = (pre) => {
        const testLines = pre.querySelectorAll(".test-example-line");
        if (testLines.length > 0) {
          return Array.from(testLines)
            .map((line) => line.textContent.trim())
            .join("\n");
        }
      
        // Handle both <br> tags and text nodes
        const content = [];
        let currentLine = '';
      
        pre.childNodes.forEach((node) => {
          if (node.nodeType === Node.TEXT_NODE) {
            const text = node.textContent;
            if (text.trim()) {
              currentLine += text;
            }
          } else if (node.nodeName === 'BR') {
            content.push(currentLine.trim());
            currentLine = '';
          }
        });
      
        // Push the last line if it exists
        if (currentLine.trim()) {
          content.push(currentLine.trim());
        }
      
        // If no content was processed, fall back to textContent
        return content.length > 0 ? content.join("\n") : pre.textContent.trim();
      };
      
      const inputExamples = Array.from(
        document.querySelectorAll(".sample-test .input pre")
      ).map(processContent);
      
      const outputExamples = Array.from(
        document.querySelectorAll(".sample-test .output pre")
      ).map(processContent);
      

      // Get input specification without the "Input" title
      const inputSpecElement = document.querySelector(".input-specification");
      const inputSpec = inputSpecElement
        ? Array.from(inputSpecElement.childNodes)
            .filter(
              (node) =>
                !node.classList || !node.classList.contains("section-title")
            )
            .map((node) => node.outerHTML || node.textContent)
            .join("")
            .trim()
        : "";

      // Get output specification without the "Output" title
      const outputSpecElement = document.querySelector(".output-specification");
      const outputSpec = outputSpecElement
        ? Array.from(outputSpecElement.childNodes)
            .filter(
              (node) =>
                !node.classList || !node.classList.contains("section-title")
            )
            .map((node) => node.outerHTML || node.textContent)
            .join("")
            .trim()
        : "";

      return {
        title,
        problemStatement,
        timeLimit,
        memoryLimit,
        inputSpecification: inputSpec,
        outputSpecification: outputSpec,
        inputExamples,
        outputExamples,
        note,
      };
    });

    return problemDetails;
  } catch (error) {
    console.error("Browser scraping error:", error);
    throw error;
  } finally {
    await browser.close();
  }
}

module.exports = { scrapeProblemWithBrowser };
