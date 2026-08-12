export interface Alleyway {
    id: string;
    name: string;
    lat: number;
    lng: number;
}

/** هر ردیف یک کوچه جدا با یک مختصات و شناسه ثابت برای URL */
export const alleyways: Alleyway[] = [
    { id: '56BDA997-0722-4722-883D-B3C9A94AD772', name: 'جوانمرد 1', lat: 36.215474, lng: 57.691075 },
    { id: '2925B39B-8DCC-4756-93CE-BE9A8FD1B536', name: 'جوانمرد 2', lat: 36.215260, lng: 57.691062 },
    { id: 'D6FC3120-54ED-4D9C-B28C-84F95CF48FF7', name: 'جوانمرد 3', lat: 36.214638, lng: 57.690683 },
    { id: '6BC93C66-38EA-4CD0-8F19-B11CAA7F0797', name: 'جوانمرد 4', lat: 36.214679, lng: 57.690770 },
    { id: 'AE5F098A-322D-4107-9E54-9241E21078B7', name: 'جوانمرد 5', lat: 36.213920, lng: 57.690344 },
    { id: 'CFA342DF-10F1-455C-B8CF-8EE5AB9A3ABE', name: 'جوانمرد 6', lat: 36.213774, lng: 57.690335 },
    { id: '65521EBF-0E92-401A-83EE-5893BC70F103', name: 'جوانمرد 7', lat: 36.213607, lng: 57.690175 },
    { id: 'A8E5FDB8-307A-47D0-9AE7-F085442530E1', name: 'جوانمرد 8', lat: 36.213669, lng: 57.690282 },
    { id: '504BBD5C-3729-46A6-ACA3-92FDFE666608', name: 'جوانمرد 9', lat: 36.213114, lng: 57.689915 },
    { id: '39FAEB5E-79F2-4931-A081-F0F315C0FD42', name: 'جوانمرد 10', lat: 36.213218, lng: 57.690065 },
    { id: '52E635FF-254F-4456-AFAE-C56C34666832', name: 'جوانمرد 11', lat: 36.211907, lng: 57.689254 },
    { id: '39BAAC99-C016-4D9C-B766-A4F020E7531F', name: 'جوانمرد 12', lat: 36.211907, lng: 57.689353 },
    { id: 'D2FD3E18-2CC5-46F7-AD3C-8BC2AA481DAC', name: 'جوانمرد 13', lat: 36.211700, lng: 57.689146 },
    { id: '29C2080C-87E7-4226-89AC-E2CDD5DD8B69', name: 'جوانمرد 14', lat: 36.211238, lng: 57.688992 },
    { id: '8D5B5794-14C7-42D1-A930-BD7DBC380DB4', name: 'جوانمرد 15', lat: 36.211243, lng: 57.688901 },
    { id: '82604DB3-2E32-450B-923C-D9A1CDE260E1', name: 'جوانمرد 16', lat: 36.210688, lng: 57.688712 },
    { id: '9254FC20-A8A5-4C3C-AB18-8685814D27F4', name: 'جوانمرد 17', lat: 36.209644, lng: 57.688172 },
    { id: 'D2150395-9FD6-4D6D-B170-B2155E3EB5D0', name: 'جوانمرد 18', lat: 36.209267, lng: 57.688086 },
    { id: 'EB786325-0D16-4F89-841D-F285F086F2E7', name: 'جوانمرد 19', lat: 36.209145, lng: 57.687975 },
    { id: 'C8E2BB0F-F6CE-4BF1-B108-0CC2632E9038', name: 'جوانمرد 20', lat: 36.208277, lng: 57.687754 },
    { id: 'F3BF6918-3890-494E-B68E-FAD7608EC088', name: 'جوانمرد 21', lat: 36.207924, lng: 57.687516 },
    { id: '21A3A1E0-F52F-4B1E-9FE1-986FABE6070B', name: 'جوانمرد 22', lat: 36.208010, lng: 57.687633 },
    { id: 'CAAB9A5B-FDC9-4119-9661-8705D2742A22', name: 'جوانمرد 23', lat: 36.207541, lng: 57.687397 },
    { id: 'B5F4F83D-CEC2-4858-B3E6-7B1576C8DCA7', name: 'جوانمرد 24', lat: 36.207430, lng: 57.687410 },
    { id: 'B52A48CE-FE15-4340-9533-B83BE91EC639', name: 'جوانمرد 25', lat: 36.207110, lng: 57.687214 },
    { id: 'BEE0C303-EC24-46B9-B520-C310FECA64FE', name: 'جوانمرد 26', lat: 36.206918, lng: 57.687207 },
    { id: 'AEE01E3D-02FE-4FE8-BB2B-9E0BA2F5F660', name: 'جوانمرد 27', lat: 36.206517, lng: 57.687029 },
];

export function findAlleywayById(id: string): Alleyway | undefined {
    const lower = id.toLowerCase();
    return alleyways.find(a => a.id.toLowerCase() === lower);
}

export function findAlleywayByName(name: string): Alleyway | undefined {
    return alleyways.find(a => a.name === name);
}

export function getAlleywayPoint(alley: Alleyway): [number, number] {
    return [alley.lat, alley.lng];
}
