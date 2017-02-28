# Written by David Wallach
# Copyright of Stocker.io 2017
# This counts the occurences of each word 
# to develop a basis for developing pattern matching algorithms
import csv

export_CSV = False

#
#
#CREATE A DICTIONARY OF WORDS 
#AND THEIR OCCURENCES TO BE EXPORTED TO AN EXCEL FILE
#
def count_words(words):
	count_list = [i * 0 for i in range(0, len(words))]
	i = 0
	for i, word in enumerate(words):
		count_list[i] = words.count(word)

	zipped_list = zip(words, count_list)
	zipped_list_unique = set(zipped_list)

	csv_export(zipped_list_unique)
	return zipped_list_unique


#
#
#EXPORT THE WORDS AND THEIR ASSOCIATIVE COUNT TO A
#.CSV FILE FOR ANLAYSIS
#
def csv_export(list_of_values):
	if export_CSV:
		with open("word_count.csv", "w") as wc:
		    w = csv.writer(wc)
		    w.writerow(["WORD", "COUNT"])
		    for row in list_of_values:
		    	w.writerow(row)

