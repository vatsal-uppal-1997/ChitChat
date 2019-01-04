import {Community} from "./Community";

class GetCommunity {
    mappings;
    constructor() {
        console.log("GetCommunities object created !");
        this.mappings = new Map<string, Community>();
    }
    async getCommunity(name: string): Promise<Community> {
        if (this.mappings.has(name)) 
            return this.mappings.get(name);
        try {
            const comm = new Community(name);
            await comm.init();
            this.mappings.set(name, new Community(name));
            return this.mappings.get(name);
        } catch (err) {
            throw err;
        }
    }
}

export default GetCommunity;