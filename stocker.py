# Written by David Wallach
# Copyright of Stocker.io 2017
# This is the main calling function 
# to run our algorithm 
import urllib2
from bs4 import BeautifulSoup
import re
import numpy as np
import getPerception
import httplib
from dateutil.parser import parse as date_parser
import requests
import json
from flask import Flask, jsonify, render_template, request, Response

app = Flask(__name__)
app.config["CACHE_TYPE"] = "null"
# cache.init_app(app)

global link_num 
link_num = 1

global total_urls
total_urls = [] #to avoid repeats

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


def get_info(links, source, company, depth, max_depth, rstrip):
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

			article_date = soup.find_all("date")
			if len(article_date) is 0:
				article_date = soup.find_all("time")
				try:
					article_date = soup.time.attrs['datetime']

				except KeyError:
					print bcolors.WARNING + "\nKey error from datetime" + bcolors.ENDC
					try: 
						article_date = soup.find_all(id="published-timestamp")
						article_date = re.findall(r'<span>(.*?)</',str(article_date),re.DOTALL)[0]
					except (AttributeError, TypeError, KeyError, IndexError) as e:
						print bcolors.WARNING + "Error is: " + str(e) + bcolors.ENDC
						article_date = "NULL"
				except AttributeError:
					print bcolors.WARNING + "\nAttribute error from datetime" + bcolors.ENDC
					try: 
						article_date = soup.find_all(id="published-timestamp")
						article_date = re.findall(r'<span>(.*?)</',str(article_date),re.DOTALL)[0]
					except (AttributeError, TypeError, KeyError, IndexError) as e:
						print bcolors.WARNING + "Eror from published-timestamp " + str(e) + bcolors.ENDC
						article_date = "NULL"
				except TypeError:
					print bcolors.WARNING + "Type error from datetime" + bcolors.ENDC
					article_date = "NULL" 


			article_title = make_title_pretty(article_title)
			article_date = date_formatter(article_date)

			print "Scraping web for company : " + bcolors.HEADER + company.upper() + bcolors.ENDC
			print "Currently parsing article : " + article_title + "\n" + "From source : "+ source 
			print "URL is : " + url
			print "Date posted : " + str(article_date)
			print bcolors.OKGREEN + "HTTP Status of Request : " + str(page.getcode()) + "\n" + bcolors.ENDC


			soup = unicode.join(u'\n',map(unicode,soup))
			suburls = getPerception.parser(soup, url, company, source, article_date, article_title, max_depth) #do the heavy lifting of breaking up the strings for the word counter
		
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

		
		if depth < max_depth:
			for link in suburls:
				url = link.rstrip().replace("u'","")
				url = link.rstrip().replace("'","")
				url = re.findall(r'="(.*?)"', url)
				try:
					print "sublink url to traverse next: " + url[0]
				except IndexError:
					pass
				get_info(url, source, company, depth+1, max_depth, False)

	


def make_title_pretty(title_html):
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



def web_scraper(queries, max_depth):
	"""
	takes in a list of queries and a integer for the depth of sublink traversals.
	It sends the list of queries to google and gets a list of URLs from the google result.
	It then calls get_info to get the necessary data from the URL
	"""

	print "got here in web scraper flask"
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

		#
		# maybe search for dates in beautiful soups object --> class="f"
		# get each object search from <div class="g"> tag until <!--n-->
		#from there get the links the same way
		# but also seek the date 

		#get all web urls from google search result 
		links = []
		for item in soup.find_all('h3', attrs={'class' : 'r'}):
		    line = (reg.match(item.a['href'][7:]).group())
		    links.append(line[:-4])

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
		get_info(links, queries[i][1], queries[i][0], 0, max_depth, True)
		i += 1

def get_symbol(symbol):
	"""
	Convert the ticker to the associated company name
	"""
	url = "http://d.yimg.com/autoc.finance.yahoo.com/autoc?query={}&region=1&lang=en".format(symbol)
	result = requests.get(url).json()
	
	for x in result['ResultSet']['Result']:
		if x['symbol'] == symbol:
			return x['name']


def call_functions():
	"""
	call the functions to create queries and run web scraper
	"""
	companies = ["under armour", "apple", "go pro", "yahoo"]
	news_sources = ["bloomberg", "seeking alpha", "market watch"]
	extra_params = ["news", "stock", "investing"]
	max_depth = 1
	queries = build_queries(companies, news_sources, extra_params) #build the google search
	web_scraper(queries, max_depth) #get the raw data from the query to be passed into get_info()

def get_JSON():
	with open('data.json') as data_file:
		data = json.load(data_file)
		return data



@app.route("/run_query/", methods=['GET'])
def run_from_web():
	print "in here"
	company_ticker = request.args.get("company").upper()
	news_sources = request.args.get("news_sources")
	# news_sources = json.JSONDecoder(news_sources)
	news_sources = json.loads(news_sources)
	print news_sources
	print company_ticker
	extra_params = ["news"]
	max_depth = 0
	company_str = get_symbol(company_ticker)
	if company_str is None:
		return {"error", "bad_ticker"}

	company = [company_str]	
	queries = build_queries(company, news_sources, extra_params)
	print "queriees have been built"
	web_scraper(queries, max_depth)
	data = getPerception.return_JSON_List()
	print data
	response = app.response_class(
        response=json.dumps(data),
        status=200,
        mimetype='application/json'
    )
	print "returning data"

	# return str(data)
	return response

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

if __name__ == "__main__":
	#Query information 
	companies = ["under armour"]
	news_sources = ["bloomberg"]
	extra_params = ["news"]
	max_depth = 0

	app.run()

	# company = get_symbol("AAPLfd")
	# print(company)

	# queries = build_queries(companies, news_sources, extra_params) #build the google search
	# web_scraper(queries, max_depth) #get the raw data from the query to be passed into get_info()
	
	# # getPerception.call_word_counter() #generate tuples of words and their count to export to .csv file



