# Written by David Wallach
# Copyright of Stocker.io 2017

import urllib2
from bs4 import BeautifulSoup
import re
import numpy as np
import json
import httplib
from dateutil.parser import parse as date_parser
import requests
import threading 
import nltk
import pysentiment as ps
from firebase import firebase
import time
from flask import Flask, jsonify, render_template, request, Response

app = Flask(__name__)
app.config["CACHE_TYPE"] = "null"
# cache.init_app(app)

tlock = threading.Lock()
firebase = firebase.FirebaseApplication('https://public-eye-e4928.firebaseio.com/')

global link_num 
link_num = 1

global total_urls
total_urls = [] #to avoid repeats

global data_glob
data_glob = [] #to accumulate total data per article consolidated from threads

global urls #maybe unused can possibly get rid of
urls = []

global total_sentiment #used only for testing correctness in output
total_sentiment = []

global total_entries #used only for testing correctness in output
total_entries = []


class bcolors:
	""" 
	used to style the output strings printed to the console
	"""
   	HEADER = '\033[95m'
   	OKBLUE = '\033[94m'
   	OKGREEN = '\033[92m'
   	WARNING = '\033[93m'
   	FAIL = '\033[91m'
   	ENDC = '\033[0m'
   	BOLD = '\033[1m'
   	UNDERLINE = '\033[4m'

## make a class for a google result with the link, date, query, company, news_source 
## a boolean if it is a sublink ect. mainly just the link and the date 

def build_queries(companies, news_sources, extra_params):
	"""
	takes in an array of companies, news sources and extra parameters and
	builds a list of qeuries
	"""
	# query=raw_input("enter your query:")
	queries = []
	for i,company in enumerate(companies):
		for j,sources in enumerate(news_sources):
			for k,params in enumerate(extra_params):
				queries.append([companies[i], news_sources[j], extra_params[k]])

	print("****************************")
	print("QUEREIS (" + str(len(queries)) +") : ")
	print("****************************")

	for i in queries:
		print(bcolors.OKBLUE + i[0] + " " + i[1] + " " + i[2] + bcolors.ENDC)
	return queries

def get_info(links, source, company, date, depth, max_depth, rstrip):
	"""
	parses the links and gathers all the sublinks as well as calls
	other functions to gather the pertinent data and perform the sentiment analysis
	"""
	global link_num
	global total_urls

	for link in links:
		print bcolors.BOLD + "-------------- ..... NEW LINK || TRYING LINK NUMBER : " + str(link_num) + " ..... ----------------" + bcolors.ENDC
		link_num += 1
		if rstrip:
			url = link.rstrip().replace("u'","")
			url = link.rstrip().replace("'","")
		else:
			url = link
		if(url[0:4] != "http") or url[len(url) - 3:] == "jpg":
			print "\n" + bcolors.FAIL + "URL is :" + url + bcolors.ENDC
			print bcolors.FAIL + "Bad URL continuing to the next one" + bcolors.ENDC + "\n"
			continue

		if url in total_urls:
			print "\n" + bcolors.FAIL + "URL is : " + url + bcolors.ENDC
			print bcolors.FAIL + "Already parsed -- skipping to the next one" + bcolors.ENDC + "\n"
			continue

		total_urls.append(url)

		req = urllib2.Request(url, headers={'User-Agent': 'Mozilla/5.0'})

		try:
			page = urllib2.urlopen(req)
			soup = BeautifulSoup(page.read().decode('utf-8', 'ignore'), "html.parser") #get all html info from webpage
			article_title = soup.find_all("title") #used for printing title to user
			sublinks_class = find_sublink_class(source)

			sublinks = soup.find_all(attrs={'class' : sublinks_class})
			sublinks = sublink_parser(sublinks, source)

			article_title = title_formatter(article_title)

			tlock.acquire()
			print "Scraping web for company : " + bcolors.HEADER + company.upper() + bcolors.ENDC
			print "Currently parsing article : " + article_title + "\n" + "From source : "+ source 
			print "URL is : " + url
			print "Date posted : " + str(date)
			print bcolors.OKGREEN + "HTTP Status of Request : " + str(page.getcode()) + "\n" + bcolors.ENDC
			tlock.release()


			soup = unicode.join(u'\n',map(unicode,soup))
			# suburls = parser(soup, url, company, source, date, article_title, max_depth) #do the heavy lifting of breaking up the strings for the word counter
			traverse_sublinks = parser(soup, url, company, source, date, article_title, max_depth)

		except (urllib2.HTTPError, urllib2.URLError) as e:
			try:
				print bcolors.FAIL + "Uh oh there was an HTTP error with opening this url: \n" + str(url)+ "\n" + "Error code " + str(e.code) + "\n" + bcolors.ENDC
				continue
			except AttributeError:
				print bcolors.FAIL + "Uh oh there was an HTTP error with opening this url: \n" + str(url)+ "\n" + bcolors.ENDC
				continue
		except httplib.BadStatusLine:
			print bcolors.FAIL + "\nUh oh we could not recognize the status code returned from the http request\n" + bcolors.ENDC
			continue

		if traverse_sublinks and depth < max_depth:
			for link in sublinks:
				url = [link[0]]
				date = link[1]
				source = link[2].upper()
				get_info(url, source, company, date, depth+1, max_depth, False)	

def title_formatter(title_html):
	"""
	used to remove the surrounding html from the article titles
	"""
	title = re.findall(r'>(.*?)<',str(title_html),re.DOTALL)
	try:
		return title[0]
	except IndexError:
		return " "

def date_formatter(date):
	"""
	format the date in a uniform way to be able to compare.
	Gets the input date and returns it in MM/DD/YY format (e.g. 2/6/17)
	"""
	print date
	try:
		date_formatted = str(date_parser(date))
	except (ValueError, AttributeError, OverflowError) as e:
		print e
		print "date set to default 'NULL' value"
		date_formatted = "NULL"

	return date_formatted

def find_sublink_class(source):
	"""
	each of the finance websites company landing pages has different classes for related articles
	this function directs the program to the proper one
	"""
	try:
		return {
		'Bloomberg': 'news-story',
		'BLOOMBERG': 'news-story',
		'SeekingAlpha': 'symbol_article'
		}[source]
	except TypeError:
		return 'unknown'

def sublink_parser(sublinks, source):
	sublink_info = []
	if source == 'Bloomberg':
		for link in sublinks:
			url = re.findall(r'href=.*?>',str(link))
			url = url[0][6:len(url)-3]
			date = re.findall(r'datetime=.*?>',str(link))
			date = date[0][10:len(date)-3]

			new_source = re.findall(r'www.*?com', url)
			new_source = new_source[0][4:len(new_source)-5]
			sublink_info.append([url, date, new_source])
	tlock.acquire()
	print sublink_info
	tlock.release()
	return sublink_info

def parser(html, url, company, source, date, title, max_depth):
	"""
	returns the sublinks embedded in the article and
	calls the tokenerizer and sentence parser methods as well as
	the export_to_JSON function if JSON global variable is set to true
	"""
	global total_sentiment
	global total_entries

	pertinent_info = []
	traverseFurther = False

	export_html = ""
	pattern = re.compile(r'<p>.*?</p>') #find only the ptag 
	data = pattern.findall(html)
	pertinent_info = pertinent_info + data
	commentSoup = BeautifulSoup(html)
	preTags = commentSoup.findAll('pre')
	try:
		data2 = preTags[0]
		# print data2
		pertinent_info += data2
	except:
		pass	

	clean_html = ""
	replace_dict = {'<p>': ' ', '</p>': ' ', 
					'<strong>': '', '</strong>': ' ', 
					'<a>': ' ','</a>': '',
					'<em>': ' ', '</em>': ' ',
					'<span>': ' ', '</span>': ' ',
					'<meta>': ' ', '</meta>': ' ',
					'&amp;apos;': ' '
					} #html tags to remove

	for info in pertinent_info:
		tags = re.compile('|'.join(replace_dict.keys())) 
		clean_html = tags.sub(lambda m: replace_dict[m.group(0)], info) #removing the html tags e.g. <p> and </p>
		# sublinks_local = re.findall(r'<a.*?>', clean_html, re.DOTALL) #get all sublinks from inside paragraphs of HTML
		clean_html = re.sub(r'<.*?>', ' ',clean_html) #remove all html tags 
		clean_html = re.sub('[^A-Za-z0-9]+', ' ', clean_html, re.DOTALL) # get rid of extraneous characters


		# if date == "NULL":
		# 	print "date is null -- continue to next iteration"
		# 	continue

		export_html += clean_html 
		
	sentiment = get_score_LM(export_html)["Polarity"]

	if sentiment == 0:
		traverseFurther = True

	if sentiment != 0:
		total_sentiment.append(sentiment)
		total_entries.append(1)

	tlock.acquire()
	print "--------------**********-------------------"
	print bcolors.OKBLUE + "Score is : " + str(sentiment) +  " for url: " + url +bcolors.ENDC
	# print export_html
	print "--------------**********-------------------"
	tlock.release()
	export_JSON_web(company, url, source, date, sentiment, title, export_html)
	
	return traverseFurther

def export_JSON_web(company, url, source, date, sentiment, title, article_data):
	global data_glob
	data = {
		"title" : title,
		"company" : company.upper(),
		"source" : source,
		"date" : date,
		"url" : url,
		# "sublinks" : sublinks,
		"article_data": article_data,
		"sentiment": sentiment
	}

	data_glob.append(data)
	urls.append(url)
	# try:
	# 	firebase.put('parsed_data',company.upper())
	# 	firebase.put(company.upper(), data)
	# except HTTPError:
	# 	firebase.post('parsed_data',company.upper())
	# 	firebase.post(company.upper(), data)
	# try:
	# 	firebase.put('URLS', urls)
	# except HTTPError:
	# 	firebase.post('URLS', urls)

def return_JSON_List():
	return data_glob

def check_relevance(html, company):
	"""
	checks if article is relevant to the company the program is currently parsing for
	"""

	company_relevant = False
	company_mentions = html
	company_mentions = re.findall(company, company_mentions, re.I)
	if len(company_mentions) > 0:
		company_relevant = True
	if company_relevant:
		print bcolors.OKGREEN +"Article is relevant results : "  + str(company_relevant) + " For company : " + company.upper() + bcolors.ENDC
	else:
		print bcolors.FAIL +"Article is relevant results "  + str(company_relevant) + " For company : " + company.upper() + bcolors.ENDC
	return company_relevant

def timing(f):
    def wrap(*args):
        time1 = time.time()
        ret = f(*args)
        time2 = time.time()
        print '%s function took %0.3f seconds' % (f.func_name, (time2-time1))
        return ret
    return wrap

@timing
def get_score_LM(html):
	"""
	Uses the Landom Mcdonald dictionary for sentiment analysis
	"""
	# print "getting sentiment"
	lm = ps.LM()
	tokens = lm.tokenize(html)
	# print tokens
	score = lm.get_score(tokens)
	# print "returning sentiment"
	return score 


def web_scraper(queries, max_depth):
	"""
	takes in a list of queries and a integer for the depth of sublink traversals.
	It sends the list of queries to google and gets a list of URLs from the google result.
	It then calls get_info to get the necessary data from the URL
	"""
	thread_inputs = []
	i = 0 #used to send correct data to the get_info function
	for i in range(0,len(queries)):

		query = queries[i][0] + " " + queries[i][1] + " " + queries[i][2]
		query=query.strip().split()
		query="+".join(query)

		#html request and Beautiful Soup parser 
		html = "https://www.google.co.in/search?site=&source=hp&q="+query+"&gws_rd=ssl"
		req = urllib2.Request(html, headers={'User-Agent': 'Mozilla/5.0'})
		soup = BeautifulSoup(urllib2.urlopen(req).read(),"html.parser")

		#Re to find URLS
		reg=re.compile(".*&sa=")

		#get all web urls from google search result 
		links = []
		for item in soup.find_all(attrs={'class' : 'g'}):
			# print "-----------------"
			# print item
			# print "-------------------"
			link = (reg.match(item.a['href'][7:]).group())
			date = re.findall(r'class="st">.*?<',str(item))
			date = re.findall(r'>.*?<',str(date))
			date = re.sub(r'[><]', '', str(date))
			date = date_formatter(date[1:len(date)-1])
		   	links.append(link[:-4])
		   	thread_inputs.append([link[:-4], queries[i][1], queries[i][0], date, 0, max_depth, True])
		print links

		#ADD SPACING
		j = 0
		for j in range(0,3):
			print('**********************************\n')

		print "URLs to parse:"
		print bcolors.BOLD + '--------------------------------------'
		for link in links:
			url = link.rstrip().replace("u'","")
			url = link.rstrip().replace("'","")
			print url  
		print '--------------------------------------' + bcolors.ENDC
		# get_info(links, queries[i][1], queries[i][0], date, 0, max_depth, True)
		
		i += 1

	threads = []
	for i in range(0, len(thread_inputs)):
		print thread_inputs[i]
		t = threading.Thread(target=get_info, args=([thread_inputs[i][0]], thread_inputs[i][1], thread_inputs[i][2], thread_inputs[i][3], thread_inputs[i][4], thread_inputs[i][5], thread_inputs[i][6]))
	   	threads.append(t)
	   	t.start()

	for i in range(0, len(threads)):
	   	t = threads[i]
	   	t.join()

# def gather_stock_data():
	#http://chart.finance.yahoo.com/table.csv?s=UA&a=2&b=6&c=2012&d=2&e=6&f=2017&g=d&ignore=.csv

def get_symbol(symbol):
	"""
	Convert the ticker to the associated company name
	"""
	url = "http://d.yimg.com/autoc.finance.yahoo.com/autoc?query={}&region=1&lang=en".format(symbol)
	result = requests.get(url).json()
	
	for x in result['ResultSet']['Result']:
		if x['symbol'] == symbol:
			return x['name']

@app.route("/run_query/", methods=['GET'])
@timing 
def run_from_web():
	company_ticker = request.args.get("company").upper()
	news_sources = request.args.get("news_sources")
	news_sources = json.loads(news_sources)
	extra_params = ["news"]
	max_depth = 1
	company_str = get_symbol(company_ticker)
	company_str = re.sub(r', Inc\.', '', company_str)
	company_str = re.sub(r'Corporation', '', company_str)
	print "company_str is:" + company_str
	if company_str is None:
		return {"error", "bad_ticker"}

	company = [company_str]	
	queries = build_queries(company, news_sources, extra_params)
	print "queriees have been built"
	web_scraper(queries, max_depth)
	print sum(total_sentiment)/len(total_entries)
	data = return_JSON_List()
	# print data
	response = app.response_class(
        response=json.dumps(data),
        status=200,
        mimetype='application/json'
    )
	print "returning data"
	return response

@app.route('/about/')
def about():
	return render_template('about.html')

@app.route('/')
def index():
	return render_template('index.html')

@app.after_request
def add_header(r):
    """
    Add headers to both force latest IE rendering engine or Chrome Frame,
    and also to cache the rendered page for 10 minutes.
    """
    r.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
    r.headers["Pragma"] = "no-cache"
    r.headers["Expires"] = "0"
    r.headers['Cache-Control'] = 'public, max-age=0'
    return r

def main():
	"""
	call the functions to create queries and run web scraper
	"""
	companies = ["under armour", "apple", "go pro", "yahoo"]
	news_sources = ["bloomberg", "seeking alpha", "market watch"]
	extra_params = ["news", "stock", "investing"]
	max_depth = 1
	queries = build_queries(companies, news_sources, extra_params) #build the google search
	web_scraper(queries, max_depth) #get the raw data from the query to be passed into get_info()
	
if __name__ == "__main__":
	app.run()
