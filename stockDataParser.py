# Written by David Wallach
# Copyright of Stocker.io 2017
# This file parses the historical 
# data about stocks 

import csv
from dateutil.parser import parse as date_parser



tickers = [["APPL", "apple"], ["YHOO", "yahoo"], ["UA", "under armour"], ["GPRO", "go pro"]]
# tickers =[['APPL', 'apple']]

class StockDataNode:
	"""
	Data correlated to a stock gotten from local 
	excel files which are downloaded from yahoo finance
	"""

	#class members 
	unordered_data = []
	dates = []
	open_values = []
	close_values = []
	day_change_values = []
	volume_traded = []
	company = None

	#class methods
 	def __init__(self, name, company):
 		self.name = name
 		self.company = company


def parse(tickers):
	"""
	Get the data from excel file and store in StockDataNode 
	"""
	StockDataNodes = []
	for tick in tickers:
		company_stock_data = StockDataNode(tick[0], tick[1])

		file_name = 'Stock_Data/' + tick[0] + '.csv'
		with open(file_name, "rb") as f:
			    reader = csv.reader(f)
			    for row in reader:
			    	company_stock_data.unordered_data.append(row)
			    f.close()

		StockDataNodes.append(company_stock_data)

	StockDataNodes = organize_data(StockDataNodes)
	return StockDataNodes


def organize_data(StockDataNodes):
	"""
	organize the data retreived from the .csv file in the StockDataNodes
	"""
	
	StockDataNodes_reformatted = []
	for node in StockDataNodes:
		#initalize array lengths with empty data
		length = len(node.unordered_data)
		dates = [' ' for i in range(0, length)]
		open_values = [' 'for i in range(0, length)]
		close_values = [' ' for i in range(0, length)]
		day_change_values = [' ' for i in range(0, length)]
		volume_traded = [' ' for i in range(0, length)]

		i = 0
		for entry in node.unordered_data:
			if i == 0:
				i += 1
				continue;
			try:
				# print "no error"
				dates[i] = str(date_parser(entry[0]))
				open_values[i] = float(entry[1])
				close_values[i] = float(entry[4])
				day_change_values[i] = close_values[i] - open_values[i]
				volume_traded[i] = entry[5]
			except ValueError:
				pass

			i += 1
		# print dates
		node.dates = dates
		node.open_values = open_values
		node.close_values = close_values
		node.day_change_values = day_change_values
		node.volume_traded = volume_traded

		StockDataNodes_reformatted.append(node)

	return StockDataNodes_reformatted

#parse(tickers)
