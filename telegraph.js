const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');
const del = require('del');
exports.Telegraph = Telegraph;


function Telegraph(thread_num, _headless = true) {
    this.thread_num = thread_num;
    this.post_list;
    this.telegraph_url;
    this.get_thread = async function () {
        const browser = await puppeteer.launch({
            headless: _headless,
            waitUntil: 'load'
        });

        const page = await browser.newPage();
        const dawn_sel = "#alert-undefined";
        const close_sel = '#plashque-close';
        const defaultViewport = {
            height: 736,
            width: 414
        };
        try {
            await page.goto(`https://2ch.hk/b/res/${this.thread_num}.html`, {
                timeout: 1000 * 60 * 2
            });
            fs.mkdir(`./${this.thread_num}`, (err) => {
                console.log(err);
                return
            });
        } catch (error) {
            console.log("2ch`s not responding");
            console.log(`https://2ch.hk/b/res/${this.thread_num}.html`);
            browser.close();
            return;
        }
        await page.waitFor(3560);
        try {
            await page.click(dawn_sel);
        } catch (error) {
            console.log("hm");
        }
        await page.waitFor(2050);
        await page.click(close_sel);
        //making background and borders white
        await page.addStyleTag({
            content: '.post.post_type_reply{border-color: white;}:root{--theme_default_postbg:white;--theme_default_bg:white}'
        });
        const bodyHandle = await page.$('body');
        const boundingBox = await bodyHandle.boundingBox();
        const newViewport = {
            width: Math.max(defaultViewport.width, Math.ceil(boundingBox.width)),
            height: Math.max(defaultViewport.height, Math.ceil(boundingBox.height)),
        };
        await page.setViewport(Object.assign({}, defaultViewport, newViewport));
        const elements = await page.$$(".post");
        for (let i = 0; i < elements.length; i++) {
            try {
                let _path = path.join(this.thread_num, `${i}.png`);
                await elements[i].screenshot({
                    path: _path
                });
                if (i % 20 === 0) {
                    await (console.log("bip ", i));
                }

            } catch (e) {
                console.log(`couldnt take screenshot of element with index: ${i}. cause: `, e)
            }
        }
        this.update_list();
        await browser.close();
    };
    this.post = async function () {
        if (!this.post_list) {
            console.log("seems like something went wrong");
            return null;
        }
        const browser = await puppeteer.launch({
            headless: _headless,
            waitUntil: 'load'
        });
        const page = await browser.newPage();
        const header = `.tl_page > .tl_article > #\_tl_editor > .ql-editor > .empty:nth-child(1)`;
        const author = '.tl_page > .tl_article > #\_tl_editor > .ql-editor > .empty:nth-child(2)';
        const editor = `.tl_page > .tl_article > #\_tl_editor > .ql-editor > .empty`;
        const image_button = '.tl_article > #\_tl_editor > #\_tl_blocks #\_image_button';

        await page.goto("https://telegra.ph/");
        await page.waitFor(1000);
        await page.waitForSelector(header);
        await page.type(header, `Thread ${this.thread_num} `);
        page.keyboard.press(String.fromCharCode(13));
        await page.waitForSelector(author);
        await page.type(author, ">>>");
        page.keyboard.press(String.fromCharCode(13));
        await page.waitForSelector(editor);
        await page.type(editor, "https://t.me/daily_b");
        page.keyboard.press(String.fromCharCode(13));
        await page.waitForSelector(image_button);
        for (file of this.post_list) {
            try {
                const [fileChooser] = await Promise.all([
                    page.waitForFileChooser(),
                    page.click(image_button),
                ]);
                fileChooser.accept([file]);
                await page.waitFor(200);
                console.log(`${file} started to upload`);
            } catch (error) {
                console.log(error);
                console.log(`Failed to upload ${file} `);
                await page.waitFor(2000);
            }

        }
        console.log("finishing");
        await page.waitFor(1000 * 60 * 0.5);
        await page.click("#_publish_button");
        await page.waitFor(5000);
        let url = await page.url();
        console.log(url);
        await browser.close();
        this.telegraph_url = url;
        await del([`./${this.thread_num}`]);
        return url;
    };
    this.update_list = function () {
        const directoryPath = path.join(__dirname, `./${this.thread_num}`);
        fs.readdir(directoryPath, (err, _files) => {
            if (err) {
                return console.log('Unable to scan directory: ' + err);
            }
            this.post_list = _files
                .sort((a, b) => {
                    // do that because of some wierd internal sorting in fs
                    return a.slice(0, -4) - b.slice(0, -4);
                })
                .map(file => {
                    return path.join(directoryPath, file);
                });
            console.log(`number of posts - ${this.post_list.length}`);
        });
    };
}