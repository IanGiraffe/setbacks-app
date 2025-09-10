import { rpc } from '@gi-nx/iframe-sdk';
import { giraffeState } from '@gi-nx/iframe-sdk';

export class EnvelopeService {
  static async createEnvelope(envelopeFeature) {
    try {
      // Store the current count of envelope features before creation
      const rawSectionsBefore = giraffeState.get('rawSections');
      const envelopesBefore = rawSectionsBefore?.features?.filter(f => f.properties?.usage === 'Envelope') || [];
      console.log('Envelopes before creation:', envelopesBefore.length);
      
      const result = await rpc.invoke('createRawSection', [envelopeFeature]);
      console.log('Create envelope result:', result);
      console.log('Create envelope result type:', typeof result);
      
      // Wait a moment for Giraffe to process, then find the new envelope
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const rawSectionsAfter = giraffeState.get('rawSections');
      const envelopesAfter = rawSectionsAfter?.features?.filter(f => f.properties?.usage === 'Envelope') || [];
      console.log('Envelopes after creation:', envelopesAfter.length);
      
      // Find the newest envelope (the one that wasn't there before)
      const newEnvelope = envelopesAfter.find(envelope => 
        !envelopesBefore.some(existing => existing.properties?.id === envelope.properties?.id)
      );
      
      if (newEnvelope) {
        console.log('Found newly created envelope with Giraffe ID:', newEnvelope.properties?.id);
        return { success: true, id: newEnvelope.properties.id, data: newEnvelope };
      } else {
        console.log('Could not identify newly created envelope, using fallback');
        return { success: true, id: envelopeFeature.properties.id, data: result };
      }
    } catch (error) {
      console.error('Error creating building envelope:', error);
      return { success: false, error: error.message };
    }
  }

  static async findExistingEnvelope(envelopeId) {
    try {
      const rawSections = giraffeState.get('rawSections');
      console.log('Searching for envelope ID:', envelopeId);
      console.log('Available rawSections features:', rawSections?.features?.length);
      
      // Debug: log all envelope-type features
      const envelopes = rawSections?.features?.filter(f => f.properties?.usage === 'Envelope');
      console.log('Found envelope features:', envelopes?.map(e => e.properties?.id));
      
      const existingEnvelope = rawSections?.features?.find(
        feature => feature.properties?.id === envelopeId && feature.properties?.usage === 'Envelope'
      );
      
      console.log('Found existing envelope:', !!existingEnvelope);
      return existingEnvelope;
    } catch (error) {
      console.error('Error finding existing envelope:', error);
      return null;
    }
  }

  static async updateEnvelope(envelopeFeature, giraffeId) {
    try {
      // Use the Giraffe-assigned ID, not our custom one
      const idToUse = giraffeId || envelopeFeature.properties.id;
      console.log('Attempting to update envelope with ID:', idToUse);
      
      // First, try to find the existing envelope to make sure it exists
      const existing = await this.findExistingEnvelope(idToUse);
      if (!existing) {
        console.log('Existing envelope not found, creating new one instead');
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
      console.log('Building envelope updated successfully:', result);
      return { success: true, data: result };
    } catch (error) {
      console.error('Error updating building envelope:', error);
      console.log('Fallback: Creating new envelope instead of updating');
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