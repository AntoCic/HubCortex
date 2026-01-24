import {
    ref as storageRef,
    getDownloadURL,
    getMetadata,
    listAll,
    uploadBytes,
    deleteObject,
    type FirebaseStorage,
    type UploadMetadata,
    type StorageReference,
    type FullMetadata,
} from 'firebase/storage'

export interface FileInfo {
    name: string
    fullPath: string
    url: string | null
    size?: number
    bucket?: string
    contentType?: string | null
    cacheControl?: string | null
    contentDisposition?: string | null
    contentEncoding?: string | null
    contentLanguage?: string | null
    generation?: string
    md5Hash?: string | null
    timeCreated?: string
    updated?: string
    customMetadata?: Record<string, string> | null
}

export class FirebaseFolder {
    /** Istanza di Firebase Storage */
    private storage: FirebaseStorage
    /** Path base della “cartella” (senza trailing slash obbligatorio) */
    readonly basePath: string

    constructor(storage: FirebaseStorage, basePath: string) {
        this.storage = storage
        this.basePath = basePath.replace(/^\/+|\/+$/g, '') // normalizza
    }

    /** Riferimento alla cartella */
    private folderRef(): StorageReference {
        return storageRef(this.storage, this.basePath)
    }

    /** Riferimento a un file nella cartella */
    private fileRef(filename: string): StorageReference {
        const clean = String(filename).replace(/^\/+/, '')
        return storageRef(this.storage, `${this.basePath}/${clean}`)
    }

    /** Converte i metadati in un FileInfo */
    private async toFileInfo(ref: StorageReference, meta?: FullMetadata): Promise<FileInfo> {
        const m = meta ?? (await getMetadata(ref))
        let url: string | null = null
        try {
            url = await getDownloadURL(ref)
        } catch {
            url = null
        }
        return {
            name: m.name,
            fullPath: m.fullPath,
            url,
            size: m.size,
            bucket: m.bucket,
            contentType: m.contentType ?? null,
            cacheControl: m.cacheControl ?? null,
            contentDisposition: m.contentDisposition ?? null,
            contentEncoding: m.contentEncoding ?? null,
            contentLanguage: m.contentLanguage ?? null,
            generation: m.generation,
            md5Hash: m.md5Hash ?? null,
            timeCreated: m.timeCreated,
            updated: m.updated,
            customMetadata: m.customMetadata ?? null,
        }
    }

    /**
     * get: ottiene info e URL di un file. Se non esiste, ritorna null.
     */
    async get(filename: string): Promise<FileInfo | null> {
        const ref = this.fileRef(filename)
        try {
            const meta = await getMetadata(ref)
            return this.toFileInfo(ref, meta)
        } catch (err: any) {
            // 'storage/object-not-found' => non esiste
            if (err?.code === 'storage/object-not-found') return null
            throw err
        }
    }

    /**
     * add: crea un nuovo file (o lo sovrascrive se già presente).
     * Usa uploadBytes per semplicità (se ti serve progress, gestiscilo con uploadBytesResumable nel parent).
     */
    async add(filename: string, data: Blob | Uint8Array | ArrayBuffer, metadata?: UploadMetadata): Promise<FileInfo> {
        const ref = this.fileRef(filename)
        await uploadBytes(ref, data, metadata)
        return this.toFileInfo(ref)
    }

    /**
     * update: alias di add (sovrascrive se esiste).
     */
    async update(filename: string, data: Blob | Uint8Array | ArrayBuffer, metadata?: UploadMetadata): Promise<FileInfo> {
        return this.add(filename, data, metadata)
    }

    /**
     * remove: elimina un file (non fallisce se già assente).
     */
    async remove(filename: string): Promise<void> {
        const ref = this.fileRef(filename)
        try {
            await deleteObject(ref)
        } catch (err: any) {
            if (err?.code === 'storage/object-not-found') return
            throw err
        }
    }

    /**
     * getAll: lista tutti i file nella cartella (non include sottocartelle ricorsive).
     * Per ogni file recupera metadati e url.
     */
    async getAll(): Promise<FileInfo[]> {
        const list = await listAll(this.folderRef())
        const items = list.items || []
        // Nota: N+1 chiamate (metadata+url per item). Per molteplici file valuta una paginazione ad-hoc.
        const infos = await Promise.all(items.map(async (ref) => this.toFileInfo(ref)))
        return infos.sort((a, b) => a.name.localeCompare(b.name))
    }

    /**
     * exists: torna true/false se il file esiste.
     */
    async exists(filename: string): Promise<boolean> {
        const ref = this.fileRef(filename)
        try {
            await getMetadata(ref)
            return true
        } catch (err: any) {
            if (err?.code === 'storage/object-not-found') return false
            throw err
        }
    }

    /**
     * getUrl: ritorna solo l’URL (o null) se vuoi essere rapido.
     */
    async getUrl(filename: string): Promise<string | null> {
        const ref = this.fileRef(filename)
        try {
            return await getDownloadURL(ref)
        } catch {
            return null
        }
    }
}
