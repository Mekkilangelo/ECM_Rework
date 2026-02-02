import React from 'react';
import { View, StyleSheet } from '@react-pdf/renderer';
import { PhotoContainer } from '../primitives';
import { PHOTO_SIZES } from '../theme';

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    width: '100%',
    rowGap: 10, // Optimized gap for 2x3 grid
  },
  itemWrapper: {
    // No specific wrapper style needed for grid usually, but strictly speaking wrap={false} on item
  },
});

export const GridPhotosLayout = ({ photos = [] }) => {
  if (!photos || photos.length === 0) return null;

  return (
    <View style={styles.container}>
      {photos.map((photo, index) => (
        <View key={photo.id || index} wrap={false}>
          <PhotoContainer
            photo={photo}
            customSize={PHOTO_SIZES.grid6Item}
            showCaption={true}
          />
        </View>
      ))}
    </View>
  );
};

export default GridPhotosLayout;
