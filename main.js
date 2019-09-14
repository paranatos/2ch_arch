/* чек тредов
 * всё из парсера где больше 400/450 постов => ()
 * () => есть ли в ссылках то игнорить
 * если нет то  создать пасту
 *              дабавить в ссылки
 *              добавить в пастебин ссылку на телеграф + просмотры + рейтинг
 *               запостить пасту
 * 
 */


const TelegramBot = require('node-telegram-bot-api');
const Telegraph = require('./telegraph').Telegraph;
const Pastebin = require('./pastebin').Pastebin;
const pasre_thread = require('./threads_parser').get_threads;
const config = require('dotenv').config({
    path: ".env"
})
const {
    bot_key,
    chat_name
} = config.parsed;
const bot = new TelegramBot(bot_key);
let links = [];
let top_threads = [];
const paste_title = "c6889183eeefeba5647eac32eaf2ae813fe35b6f";
const nop = ["webm", "fap", "вебм", "фап"];

post_new();

function post_new() {
    pasre_thread(top_threads, nop, {
            num: 1,
            max_posts: 100
        })
        .then(res => {
            //res = [...,[title,score,views,num,posts],...]
            return res.filter(thread => {
                if (links.indexOf(thread[3]) === -1) {
                    links.push(thread[3]);
                    return true;
                }
                return false;
            });
        })
        .then(async (threads) => {
            let urls = [];
            for (thread of threads) {
                console.log(thread[0]);
                let telegraph = new Telegraph(thread[3]);
                await telegraph.get_thread();
                let url = await telegraph.post();
                await urls.push(url);
            }
            return urls;

        })
        .then(urls => {
            urls.forEach(url => {
                console.log(url);
            })
        })
        .catch(error => {
            console.log(error);
        });
}