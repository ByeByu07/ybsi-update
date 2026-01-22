import { db } from "@/db";
import { eq } from "drizzle-orm";
import { organization, member } from "@/db/schema";

export const setDefaultOrg = async (userId: string) => {

    let organizationDataResult;

    try {
        const [memberData] = await db.select().from(member).where(eq(member.userId, userId));

        const [organizationData] = await db.select().from(organization).where(eq(organization.id, memberData.organizationId));

        organizationDataResult = organizationData;
    } catch (err) {
        organizationDataResult = null;
    }

    return organizationDataResult;
}