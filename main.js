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
const nop = ["webm", "fap", "вебм", "фап", "аварий", "ролл", "гороскоп",
    "олень", "засмеялся-", "gg", "e", "mp3", "процессор", "голова", "рулетка",
    "mp4", "музыкальный", "музыка", "сопля", "гетеро", "трап", "сами воруете программы",
    "вл тред", "я тян", "скину через", "скину через", "добропочта", "злопочта", "хуетред",
    "флорентина", "аниме", "пкм", "qtr4", "как можно любить тян которую кто-то ебал",
    "угадай", "кунчик", "тест", "test", "морская улиточка", "не иметь тян", "покрас", "европа",
    "инцел", "танцульки",
];

post_new();

function post_new() {
    pasre_thread(top_threads, nop, {
            num: 5
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
                bot.sendMessage(chat_name, url).then(res => {
                    console.log(res);
                });
                console.log(url);
            })
        })
        .catch(error => {
            console.log(error);
        });
}