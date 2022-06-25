#!/usr/bin/env python2
# # -*- coding: utf-8 -*-
from email import header
import json
from logging import exception
import argparse
from bcrypt import re
import requests
from urllib.parse import unquote
import urllib3

urllib3.disable_warnings()
parser = argparse.ArgumentParser(description='ZK Basic Reading Tests')
parser.add_argument('-q', '--queries',
                    type=str,
                    help='{\"url\":\"http://10.20.1.201:8098/api/transaction/list?pageNo=1&pageSize=20&access_token=6AABB62DB8878A4D7373F57A237F6C94ABAA7B5261729D956E9593DF1F48D504\", \"method\":\"post\"}', default='\{\}')

parser.add_argument('-p', '--params',
                    type=str,
                    help='{\"pageSize\":\"1\"}', default='\{\}')

args = parser.parse_args()

if args.queries:
    try:
        _paramsJson = json.loads(unquote(args.queries))
        url = _paramsJson['url']
        method = _paramsJson['method'] if _paramsJson.get('method') else 'get'
        params = _paramsJson['params'] if _paramsJson.get('params') else {}
        headers = _paramsJson['headers'] if _paramsJson.get('headers') else {}

        session = requests.Session()
        if method == 'get':
            res = session.get(url, params=params, headers=headers, verify=False)
            print(json.dumps({"header": res.headers.__dict__,
                            "status": str(res.status_code),
                            "params": str(params),
                            "response": res.text if 'html>' not in res.text else ""}))
        if method == 'post':
            res = session.post(url, data=params, headers=headers, verify=False)
            print(json.dumps({"header": res.headers.__dict__,  "status": str(res.status_code), "params": str(params), "response": res.text if 'html>' not in res.text else ""}))
    except Exception as e:
        print(json.dumps({"header": "", "response": "", "error": str(e.args)}))

