import React from 'react';
import { View, StyleSheet } from '@react-pdf/renderer';
import { PhotoContainer } from '../primitives';
import { PHOTO_SIZES } from '../theme';

const styles = StyleSheet.create({
  container: {
    flexDirection: 'column',
    alignItems: 'center',
    gap: 2, // Optimized gap for vertical stacking
    width: '100%',
  },
  itemWrapper: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 2,
  },
});

export const VerticalPhotosLayout = ({ photos = [] }) => {
  if (!photos || photos.length === 0) return null;

  return (
    <View style={styles.container}>
      {photos.map((photo, index) => (
        <View key={photo.id || index} style={styles.itemWrapper} wrap={false}>
          <PhotoContainer
            photo={photo}
            customSize={PHOTO_SIZES.verticalItem}
            showCaption={true}
          />
        </View>
      ))}
    </View>
  );
};

export default VerticalPhotosLayout;
