import {GoogleSpreadsheet} from "google-spreadsheet";

let docRef = null;
let loadedDocument = null;
let loadedSheet = null;
let data = [];

const getDocReference = async (_googleSheetId) => {
    let _doc = docRef;
    if (loadedDocument !== _googleSheetId) {
        _doc = new GoogleSpreadsheet(_googleSheetId);
        await _doc.useServiceAccountAuth({
            client_email: credentials.client_email,
            private_key: credentials.private_key,
        });
        await _doc.loadInfo();
    }
    return _doc;
};

const writeData = async (
    _data,
    _googleSheetId,
    _sheetTitle = "Sheet1",
    _headerRow = 1
) => {
    const _doc = await getDocReference(_googleSheetId);
    const sheet = _doc.sheetsByTitle[_sheetTitle];
    await sheet.loadHeaderRow(_headerRow);
    await sheet.addRow(_data);
};

const getAllData = async (
    _googleSheetId = loadedDocument,
    _sheetTitle = "Sheet1",
    _headerRow = 1
) => {
    // 
    const _doc = await getDocReference(_googleSheetId);
    const sheet = _doc.sheetsByTitle[_sheetTitle];
    await sheet.loadHeaderRow(_headerRow);
    const rows = await sheet.getRows();
    // 
    return rows;
};

export const loadDocument = async (
    googleSheetId,
    defaultSheetName = "Sheet1",
    defaultHeaderRow = 1
) => {
    const doc = new GoogleSpreadsheet(googleSheetId);
    await doc.useServiceAccountAuth({
        client_email: credentials.client_email,
        private_key: credentials.private_key,
    });
    await doc.loadInfo();
    docRef = doc;
    const _data = await getAllData(
        googleSheetId,
        defaultSheetName,
        defaultHeaderRow
    );
    loadedDocument = googleSheetId;
    loadedSheet = defaultSheetName;
    data = _data;
};

// Custom methods for this specific project

export const refreshData = async () => {
    data = await getAllData(
        loadedDocument,
        loadedSheet
    );
}

export const getLevels = async () => {
    if (loadedSheet === 'tabIndex') {
        return data;
    } else {
        return await getAllData(loadedDocument, "tabIndex");
    }
}

export const getMiscellaneousData = async () => {
    if (loadedSheet === 'miscellaneous') {
        return data;
    } else {
        return await getAllData(loadedDocument, "miscellaneous");
    }
}

export const
    getLevel = async (_tabName) => {
        return data.find(_level => _level['Tab Name'] === _tabName);
    }

export const createLevel = async (_data) => {
    const newSheet = await docRef.addSheet();
    await newSheet.updateProperties({title: _data['Tab Name']});
    await newSheet.setHeaderRow([
        'Type',
        'Leadership Ability',
        'Name',
        'Subject',
        'Email',
        'Question',
        'Answer One',
        'Response One',
        'Answer Two',
        'Response Two',
        'Answer Three',
        'Response Three',
        'Answer Four',
        'Response Four',
        'Response',
        'Reward',
        'Difficulty'
    ]);

    const _sheet = docRef.sheetsByTitle['tabIndex'];
    await _sheet.addRow(_data);
    await refreshData();
}

export const getQuestions = async (_tabName) => {
    return await getAllData(loadedDocument, _tabName);
}

export const createQuestion = async (_levelName, _data) => {
    
    _levelName.toString();
    await writeData(_data, loadedDocument, _levelName);
}

export const getQuestion = async (_levelName, _index) => {
    const questions = await getAllData(loadedDocument, _levelName);
    
    return questions.length > _index ? questions[_index] : null;
};