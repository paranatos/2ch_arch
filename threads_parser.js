const axios = require("axios");
const Entities = require('html-entities').AllHtmlEntities;
const entities = new Entities();
exports.get_threads = get_top_threads;

function get_top_threads(top_threads, blacklist, {
    num = 10,
    max_posts = null
}) {
    return axios({
            method: "GET",
            url: "https://2ch.hk/b/threads.json"
        })
        .then(res => {
            let threads = res.data.threads;
            threads = threads
                .sort((a, b) => {
                    return b.score - a.score;
                })
                .slice(0, 100)
                /* .filter(thread => {
                    return !new RegExp(`([a-zA-Z0-9]+://)?([a-zA-Z0-9_]+:[a-zA-Z0-9_]+@)?([a-zA-Z0-9.-]+\\.[A-Za-z]{2,4})(:[0-9]+)?(/.*)?`)
                        .test(thread.subject.toLowerCase());
                }) */
                .filter(thread => {
                    return !blacklist.some(word => {
                        return thread.subject.toLowerCase().includes(word);
                    })
                })
                .sort((a, b) => {
                    return b.views - a.views;
                })
                .slice(0, 50)
                .filter(thread => {
                    if (max_posts) {
                        return thread.posts_count < max_posts;
                    }
                    return true;
                })
                .sort((a, b) => {
                    return b.posts_count - a.posts_count;
                })
                .slice(0, num);
            return threads;
        })
        .then(threads => {
            threads
                .forEach(thread => {
                    if (top_threads.every(thr => {
                            return thr.subject != thread.subject;
                        })) {
                        top_threads.push({
                            subject: thread.subject,
                            score: thread.score,
                            views: thread.views,
                            num: thread.num,
                            posts_count: thread.posts_count
                        });
                    } else {
                        top_threads = top_threads.map(thr => {
                            if (thr.subject == thread.subject) {
                                thr.score = thread.score;
                                thr.views = thread.views;
                            }
                            return thr;
                        })
                    }

                });
            top = top_threads.map(thread => {
                return [
                    entities.decode(thread.subject),
                    thread.score.toFixed(2),
                    thread.views,
                    thread.num,
                    thread.posts_count
                ];
            });
            return top;
        })
        .catch(error => {
            console.log(error);
        });
}