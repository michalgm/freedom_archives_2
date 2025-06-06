--- Collections
UPDATE freedom_archives_old.collections
SET
    parent_id=NULL
WHERE
    collection_id=1000;

UPDATE freedom_archives_old.collections
SET
    collection_name='Featured'
WHERE
    collection_id=0;

UPDATE freedom_archives_old.collections
SET
    call_number=TRIM(call_number);

--- Documents/Records
ALTER TABLE freedom_archives_old.documents
ADD COLUMN year_is_circa BOOLEAN;

UPDATE freedom_archives_old.documents
SET
    call_number=TRIM(call_number)
WHERE
    call_number IS NOT NULL;

UPDATE freedom_archives_old.documents
SET
    call_number=NULL
WHERE
    call_number='null'
    OR call_number='';

UPDATE freedom_archives_old.documents
SET
    call_number=REGEXP_REPLACE(call_number, '  +', ' ')
WHERE
    call_number~'  +';

UPDATE freedom_archives_old.documents
SET
    call_number=REGEXP_REPLACE(call_number, '^C(OI)? 10 (\d+)$', 'COI \2')
WHERE
    call_number~'^C(OI)? 10 \d+$';

-- UPDATE freedom_archives_old.documents
-- SET
--     call_number=REGEXP_REPLACE(call_number, '^10 (\d+)$', 'COI \1')
-- WHERE
--     call_number~'^10 \d+$';
UPDATE freedom_archives_old.documents
SET
    call_number=REGEXP_REPLACE(call_number, ' +(A|B|C)$', '\1')
WHERE
    call_number~' +(A|B|C)$';

UPDATE freedom_archives_old.documents
SET
    call_number=REGEXP_REPLACE(call_number, '^Vin (.+)', 'VIN \1')
WHERE
    call_number~'^Vin ';

UPDATE freedom_archives_old.documents
SET
    MONTH=CASE LOWER(MONTH)
        WHEN 'ja' THEN '1'
        WHEN 'fe' THEN '2'
        WHEN 'ma' THEN '3'
        WHEN 'ap' THEN '4'
        WHEN 'ma' THEN '5'
        WHEN 'ju' THEN '6'
        WHEN 'ju' THEN '7'
        WHEN 'au' THEN '8'
        WHEN 'ag' THEN '8'
        WHEN 'se' THEN '9'
        WHEN 'oc' THEN '10'
        WHEN 'no' THEN '11'
        WHEN 'de' THEN '12'
        WHEN '1(' THEN '?'
        ELSE MONTH
    END
WHERE
    MONTH!~'^\d{1,2}$'
    AND MONTH!='?';

UPDATE freedom_archives_old.documents
SET
    DAY='30'
WHERE
    MONTH IN ('4', '6', '9', '11')
    AND DAY='31';

UPDATE freedom_archives_old.documents
SET
    DAY='28'
WHERE
    MONTH='2'
    AND DAY IN ('29', '30', '31');

UPDATE freedom_archives_old.documents
SET
    DAY='7'
WHERE
    DAY='7,';

UPDATE freedom_archives_old.documents
SET
    YEAR=update_data.new_year
FROM
    (
        VALUES
            ('1998-1999', 'c1999'),
            ('1073', '1973'),
            ('41216', '?'),
            ('41216', '1975'),
            ('35445', '1997'),
            ('35462', '1997'),
            ('33773', '?'),
            ('32868', '?'),
            ('1985;1956', '1986'),
            ('1977-78', 'c1978'),
            ('1975-76', 'c1976'),
            ('1971-1972', 'c1972'),
            ('Summer-Fal', '1965'),
            ('1974-1975', 'c1975'),
            ('1971-1972', 'c1972'),
            ('1073', '1973'),
            ('1991-2', 'c1992'),
            ('1974-75', 'c1975'),
            ('1974-75', 'c1975'),
            ('1965, 1967', '1967'),
            ('91/1992', '1992'),
            ('1014', '2014'),
            ('19973', '1973'),
            ('1964 or 19', '1965'),
            ('1076', '1976'),
            ('2004; 2005', '2005'),
            ('2005-2006', '2006')
    ) AS update_data (YEAR, new_year)
WHERE
    freedom_archives_old.documents.YEAR=update_data.year;

UPDATE freedom_archives_old.documents
SET
    YEAR=update_data.new_year,
    MONTH=update_data.new_month
FROM
    (
        VALUES
            ('Aug-02', '2002', '8'),
            ('Jan-68', '1968', '1'),
            ('Sep-67', '1967', '9'),
            ('Mar-70', '1970', '3'),
            ('Sep-68', '1968', '9'),
            ('Dec-68', '1968', '12'),
            ('Jul-81', '1981', '7')
    ) AS update_data (YEAR, new_year, new_month)
WHERE
    freedom_archives_old.documents.YEAR=update_data.year;

UPDATE freedom_archives_old.documents
SET
    YEAR=REGEXP_REPLACE(YEAR, '^[c.? ]*(\d+)[ ?]*$', '\1'),
    year_is_circa=TRUE
WHERE
    (
        YEAR LIKE 'c%'
        OR YEAR LIKE '%?%'
    )
    AND YEAR!='?';

UPDATE freedom_archives_old.documents
SET
    YEAR=CASE YEAR
        WHEN '2005-2006' THEN '2005'
        WHEN '20042005' THEN '2004'
        WHEN '2006-2007' THEN '2006'
        ELSE YEAR
    END
WHERE
    YEAR!~'^\d{2,4}$'
    AND YEAR!='?';

UPDATE freedom_archives_old.documents
SET
    YEAR=CASE
        WHEN YEAR::INT>25
        AND YEAR::INT<99 THEN (YEAR::INT+1900)::TEXT
        WHEN YEAR::INT<=25 THEN (YEAR::INT+2000)::TEXT
        ELSE YEAR
    END
WHERE
    YEAR~'^\d{2}$'
    AND YEAR!='?';

SELECT
    YEAR,
    docid,
    'https://search.freedomarchives.org/admin/#/documents/'||docid,
    title
FROM
    freedom_archives_old.documents
WHERE
    YEAR!~'^\d{2,4}$'
    AND YEAR!='?';

UPDATE freedom_archives_old.documents
SET
    YEAR='?'
WHERE
    YEAR!~'^\d{2,4}$'
    AND YEAR!='?';

---    users
UPDATE freedom_archives_old.users
SET
    status='active'
WHERE
    username='greg';

UPDATE freedom_archives_old.users
SET
    status='active',
    ROLE='staff'
WHERE
    username='dlb';

UPDATE freedom_archives_old.users
SET
    firstname='Intern'
WHERE
    username='intern';

INSERT INTO
    freedom_archives_old.list_items (
        item,
        TYPE,
        description
    )
VALUES
    ('LT', 'call_number', 'Legacy of Torture');