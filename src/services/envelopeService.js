import { rpc } from '@gi-nx/iframe-sdk';
import { giraffeState } from '@gi-nx/iframe-sdk';

export class EnvelopeService {
  static async createEnvelope(envelopeFeature) {
    try {
      // Store the current count of envelope features before creation
      const rawSectionsBefore = giraffeState.get('rawSections');
      const envelopesBefore = rawSectionsBefore?.features?.filter(f => f.properties?.usage === 'Envelope') || [];

      const result = await rpc.invoke('createRawSection', [envelopeFeature]);

      // Wait a moment for Giraffe to process, then find the new envelope
      await new Promise(resolve => setTimeout(resolve, 1000));

      const rawSectionsAfter = giraffeState.get('rawSections');
      const envelopesAfter = rawSectionsAfter?.features?.filter(f => f.properties?.usage === 'Envelope') || [];

      // Find the newest envelope (the one that wasn't there before)
      const newEnvelope = envelopesAfter.find(envelope =>
        !envelopesBefore.some(existing => existing.properties?.id === envelope.properties?.id)
      );

      if (newEnvelope) {
        return { success: true, id: newEnvelope.properties.id, data: newEnvelope };
      } else {
        return { success: true, id: envelopeFeature.properties.id, data: result };
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  static async findExistingEnvelope(envelopeId) {
    try {
      const rawSections = giraffeState.get('rawSections');

      const existingEnvelope = rawSections?.features?.find(
        feature => feature.properties?.id === envelopeId && feature.properties?.usage === 'Envelope'
      );

      return existingEnvelope;
    } catch (error) {
      return null;
    }
  }

  static async updateEnvelope(envelopeFeature, giraffeId) {
    try {
      // Use the Giraffe-assigned ID, not our custom one
      const idToUse = giraffeId || envelopeFeature.properties.id;

      // First, try to find the existing envelope to make sure it exists
      const existing = await this.findExistingEnvelope(idToUse);
      if (!existing) {
        return this.createEnvelope(envelopeFeature);
      }

      // Update the envelope feature to use the correct Giraffe ID
      const updatedFeature = {
        ...envelopeFeature,
        properties: {
          ...envelopeFeature.properties,
          id: idToUse
        }
      };

      const result = await rpc.invoke('updateRawSection', [updatedFeature]);
      return { success: true, data: result };
    } catch (error) {
      // Fallback to creating a new envelope
      return this.createEnvelope(envelopeFeature);
    }
  }

  static async createOrUpdateEnvelope(envelopeFeature, existingGiraffeId = null) {
    if (existingGiraffeId) {
      return this.updateEnvelope(envelopeFeature, existingGiraffeId);
    } else {
      return this.createEnvelope(envelopeFeature);
    }
  }
}