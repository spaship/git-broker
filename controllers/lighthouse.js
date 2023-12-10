const { log } = require('@spaship/common/lib/logging/pino');
const argv = require('yargs').argv;
const url = require('url');
const fs = require('fs');
const { globSync } = require('glob');
const path = require('path');
const { orchestratorLighthouseDetails } = require('../services/common');
const { execSync } = require('child_process');
const launchChromeAndRunLighthouse = async (url) => {
	log.info(`launching lighthouse and chrome : ${url} `);
	const lighthouse = (await import('lighthouse')).default;
	const chromeLauncher = await import('chrome-launcher');
	try {
		log.info(`launching chrome`);
		const chrome = await chromeLauncher.launch({
			protocolTimeout: 30000,
			chromeFlags: ['--headless', '--no-sandbox', '--disable-setuid-sandbox', '--disable-network-throttling', '--disable-cpu-throttling']
		});
		log.info(`chrome port - ${chrome.port}`);
		const opts = {
			port: chrome.port
		};
		log.info(`launching lighthouse`);
		const results = await lighthouse(url, opts);
		log.info(results);
		await chrome.kill();
		return {
			js: results.lhr,
			json: results.report
		};
	} catch (e) {
		log.error(e);
		//throw new Error(e);
	}
};

const getContents = (pathStr) => {
	try {
		log.info(`getContents : ${pathStr} `);
		const output = fs.readFileSync(pathStr, 'utf8', (err, results) => {
			return results;
		});
		return JSON.parse(output);
	} catch (e) {
		log.error(e);
		throw new Error(e);
	}
};

const compareReports = (from, to) => {
	const reports = [];
	log.info(`Comparing reports`);
	const metricFilter = [
		'first-contentful-paint',
		'first-meaningful-paint',
		'speed-index',
		'estimated-input-latency',
		'total-blocking-time',
		'max-potential-fid',
		'time-to-first-byte',
		'first-cpu-idle',
		'interactive'
	];

	const calcPercentageDiff = (from, to) => {
		const per = ((to - from) / from) * 100;
		return Math.round(per * 100) / 100;
	};
	try {
		for (let auditObj in from['audits']) {
			if (metricFilter.includes(auditObj)) {
				const percentageDiff = calcPercentageDiff(from['audits'][auditObj].numericValue, to['audits'][auditObj].numericValue);
				let logColor = '\x1b[37m';
				const log = (() => {
					if (Math.sign(percentageDiff) === 1) {
						logColor = '\x1b[31m';
						return `${percentageDiff.toString().replace('-', '') + '%'} slower`;
					} else if (Math.sign(percentageDiff) === 0) {
						return 'unchanged';
					} else {
						logColor = '\x1b[32m';
						return `${percentageDiff.toString().replace('-', '') + '%'} faster`;
					}
				})();
				console.log(logColor, `${from['audits'][auditObj].title} is ${log}`);
				reports.push(`${from['audits'][auditObj].title} is ${log}`);
			}
		}
		return reports;
	} catch (e) {
		log.error(e);
		throw new Error(e);
	}
};

const getOverallReport = async (result) => {
	const reports = [];
	const metricFilter = [
		'first-contentful-paint',
		'first-meaningful-paint',
		'speed-index',
		'estimated-input-latency',
		'total-blocking-time',
		'max-potential-fid',
		'time-to-first-byte',
		'first-cpu-idle',
		'interactive'
	];
	let report = Object();
	for (let auditObj in result['audits'])
		if (metricFilter.includes(auditObj))
			report[auditObj] = result['audits'][auditObj].numericValue;

	log.info(`lighthouse report`);
	log.info(JSON.stringify(report))
	return report;
}


module.exports.launchChromeAndRunLighthouse = async (req, res) => {
	const payload = req.body;
	try {
		launchChromeAndRunLighthouseService(payload);
	} catch (e) {
		log.error(e);
	}
	res.send({ message: `report generation started` });
	return;
}

const launchChromeAndRunLighthouseService = async (payload) => {
	const { propertyIdentifer, applicationIdentifier, env, url, identifier } = payload;
	// let comparedReport;
	let overAllReport;
	let dirName = 'report';

	try {
		if (!fs.existsSync(dirName)) {
			fs.mkdirSync(dirName);
		}
	} catch (e) {
		log.error(e);
		return;
	}

	let results;
	try {
		results = await launchChromeAndRunLighthouse(payload.url);
		overAllReport = await getOverallReport(results.js);
	} catch (e) {
		log.error(e);
		const orchestratorPayload = { errorMessage: `Report Generation Failed`, stackTrace: JSON.stringify(e), propertyIdentifer, applicationIdentifier, env, url, identifier };
		await orchestratorLighthouseDetails(orchestratorPayload);
		return;
	}

	try {

		/*
		const prevReports = globSync(`${dirName}/*.json`);

		if (prevReports.length) {
			dates = [];
			for (report in prevReports) {
				dates.push(new Date(path.parse(prevReports[report]).name.replace(/_/g, ':')));
			}
			const max = dates.reduce(function (a, b) {
				return Math.max(a, b);
			});
			const recentReport = new Date(max).toISOString();

			const recentReportContents = getContents(dirName + '/' + recentReport.replace(/:/g, '_') + '.json');

			comparedReport = await compareReports(recentReportContents, results.js);
		}
		*/
		const orchestratorPayload = { report: overAllReport, propertyIdentifer, applicationIdentifier, env, url, identifier };
		await orchestratorLighthouseDetails(orchestratorPayload);

	} catch (e) {
		log.error(e);
	}

	/*
	try {
		fs.writeFile(`${dirName}/${results.js['fetchTime'].replace(/:/g, '_')}.json`, results.json, (err) => {
		if (err) throw err;
		});
		res.send({ message: `Lighthouse report generated successfully `, fileName: `${dirName}/${results.js['fetchTime'].replace(/:/g, '_')}.json`, overAllReport, comparedReport })
	} catch (e) {
		log.error(e);
	}
	*/
};




module.exports.lhcli = async (req, res) => {
	const url = req.body.url;

	if (!url) {
		return res.status(400).json({ error: 'URL parameter is required' });
	}
	try {
		// Run Lighthouse command synchronously
		const result = execSync(`lhci collect --url=${url}`).toString();
		console.log(result);
		// You may want to parse the result and extract relevant information
		// For simplicity, the raw result is sent in the response
		res.json({ result });

	} catch (error) {
		console.error(error.message);
		res.status(500).json({ error: 'Internal server error' });
	}
}