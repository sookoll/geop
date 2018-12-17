import json
import glob, os
import re

translationsFile = 'src/config/translations.json'
searchPattern = 'src/**/*.js'
regx = "(\${|\s|\()t\('([^')}]+)'\)}?"
defaultLang = 'en'

def getFileMatches(pattern):
    result = []
    for filename in glob.iglob(pattern, recursive=True):
        textfile = open(filename, 'r')
        filetext = textfile.read()
        textfile.close()
        tuples = re.findall(regx, filetext)
        matches = []
        for tuple in tuples:
            matches.append(tuple[1])
        result.append({
            "file": filename,
            "matches": matches
        })
    return result

def getUniqueMatches(input):
    result = []
    for row in input:
        result = result + list(set(row['matches']) - set(result))
    result.sort(key=lambda x: x.lower())
    return result

def getCurrentTranslations(filename):
    jsonData = {}
    with open(filename) as f:
        jsonData = json.load(f)
        f.close()
    return jsonData

def getCurrentTranslationKeys(data):
    keys = []
    for lang in data:
        keys = keys + list(set(data[lang]) - set(keys))
    keys.sort(key=lambda x: x.lower())
    return keys

# current in translations file
currentTranslations = getCurrentTranslations(translationsFile)
currentTranslationKeys = getCurrentTranslationKeys(currentTranslations)
print('Read current translations strings.')
# try to find from files (not search these with variables!!)
filesMatches = getFileMatches(searchPattern)
translationKeys = getUniqueMatches(filesMatches)
print('Search translation strings from source code.')
# get unique list of all translation keys
newTranslationKeys = currentTranslationKeys + list(set(translationKeys) - set(currentTranslationKeys))
newTranslationKeys.sort(key=lambda x: x.lower())
print('Merge all together.')
# new list of translations
newTranslations = {}
for lang in currentTranslations:
    newTranslations[lang] = {}
    for key in newTranslationKeys:
        if key in currentTranslations[lang]:
            newTranslations[lang][key] = currentTranslations[lang][key]
        elif key in currentTranslations[defaultLang]:
            newTranslations[lang][key] = currentTranslations[defaultLang][key]
        else:
            newTranslations[lang][key] = key
print('Write into translations file.')
# overwrite file
with open(translationsFile, 'w') as f:
    json.dump(newTranslations, f, indent=2, ensure_ascii=False)
    f.close()
    print('Done.')
