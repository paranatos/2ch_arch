const axios = require("axios");
const config = require('dotenv').config({
    path: ".env"
});
const convert = require("xml-js");

exports.Pastebin = Pastebin;

function Pastebin() {
    this.api_dev_key = config.parsed.api_dev_key;
    this.api_user_key = config.parsed.api_user_key;

    this.create_paste = function (text, paste_name) {
        const base_url = 'https://pastebin.com/api/api_post.php';
        const api_option = "paste";
        const api_dev_key = this.api_dev_key;
        const api_user_key = this.api_user_key;
        const api_paste_code = text;
        const api_paste_private = '0';
        const api_paste_name = paste_name;
        const api_paste_expire_date = '1M';
        const api_paste_format = 'json';
        const my_data = encodeURI(
            `api_dev_key=${api_dev_key}` +
            `&api_option=${api_option}` +
            `&api_paste_code=${api_paste_code}` +
            `&api_user_key=${api_user_key}` +
            `&api_paste_name=${api_paste_name}` +
            `&api_paste_format=${api_paste_format}` +
            `&api_paste_private=${api_paste_private}` +
            `&api_paste_expire_date=${api_paste_expire_date}`
        );
        return axios({
            method: "POST",
            url: base_url,
            data: my_data
        }).then(res => {
            return res.data;
        }).catch(error => {
            return error;
        });
    };
    this.delete_paste = function (key) {
        const base_url = 'https://pastebin.com/api/api_post.php';
        const api_option = "delete";
        const api_dev_key = this.api_dev_key;
        const api_user_key = this.api_user_key;
        const paste_key = key;

        const my_data = encodeURI(
            `&api_option=${api_option}` +
            `&api_user_key=${api_user_key}` +
            `&api_dev_key=${api_dev_key}` +
            `&api_paste_key=${paste_key}`
        );
        return axios({
                method: "POST",
                url: base_url,
                data: my_data
            })
            .then(res => {
                return res.data;
            })
            .catch(error => {
                return error;
            });
    };
    this.get_paste_key = function (title) {
        const base_url = 'https://pastebin.com/api/api_post.php';
        const api_dev_key = this.api_dev_key;
        const api_user_key = this.api_user_key;
        const my_data = encodeURI(
            `api_dev_key=${api_dev_key}` +
            `&api_option=list` +
            `&api_user_key=${api_user_key}`
        );
        return axios({
                method: "POST",
                url: base_url,
                data: my_data
            }).then(response => {
                response = `<pastes>${response.data}</pastes>`;
                let json_data = convert
                    .xml2json(response, {
                        compact: true,
                        spaces: 4
                    });
                let paste_keys = JSON.parse(json_data).pastes.paste
                    .map(paste => {
                        return {
                            paste_title: paste.paste_title._text,
                            paste_key: paste.paste_key._text
                        };
                    });
                return (paste_keys);

            })
            .then(paste_keys => {
                let key;
                paste_keys.forEach(paste => {
                    if (paste.paste_title == title) {
                        key = paste.paste_key;
                    }
                });
                return key;
            })
            .catch(error => {
                return error;
            });
    };
    this.get_paste = function (key) {
        const base_url = `https://pastebin.com/raw/${key}`;
        return axios({
            method: "POST",
            url: base_url
        }).then((result) => {
            return result.data;
        }).catch((err) => {
            return err;
        });
    };
    this.push_to_paste = function (title, data) {
        //expects to get an array
        let _key;
        return this.get_paste_key(title)
            .then(key => {
                _key = key;
                return this.get_paste(key);
            })
            .then(paste => {
                this.delete_paste(_key);
                if (typeof (paste) === 'string') {
                    paste = JSON.parse(paste);
                }
                data.forEach(data_piece => {
                    paste.push(data_piece);
                });
                paste = JSON.stringify(paste);
                return this.create_paste(paste, title);
            })

    }
}