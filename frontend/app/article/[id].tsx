import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Share,
  Linking,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Calendar, Clock, ExternalLink, Share2 } from 'lucide-react-native';
import { Article } from '../../services/api';

export default function ArticleDetailScreen() {
  const params = useLocalSearchParams<{ id: string; article: string }>();
  const router = useRouter();
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      if (params.article) {
        const parsedArticle = JSON.parse(params.article);
        setArticle(parsedArticle);
      }
    } catch (error) {
      console.error('Error parsing article:', error);
    } finally {
      setLoading(false);
    }
  }, []); // Empty dependency - only run once on mount

  const handleShare = async () => {
    if (!article) return;
    
    try {
      await Share.share({
        message: `${article.title}\n\n${article.description}\n\n${article.url || ''}`,
        title: article.title,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const handleOpenOriginal = () => {
    if (article?.url) {
      Linking.openURL(article.url);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2D6A4F" />
        <Text style={styles.loadingText}>Đang tải...</Text>
      </View>
    );
  }

  if (!article) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Không tìm thấy bài viết</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Quay lại</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color="#1B4332" />
        </TouchableOpacity>
        <View style={styles.headerActions}>
          {article.url && (
            <TouchableOpacity style={styles.headerButton} onPress={handleOpenOriginal}>
              <ExternalLink size={20} color="#1B4332" />
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.headerButton} onPress={handleShare}>
            <Share2 size={20} color="#1B4332" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Image */}
        {article.image_url && (
          <Image source={{ uri: article.image_url }} style={styles.image} />
        )}

        {/* Content Container */}
        <View style={styles.contentContainer}>
          {/* Category Badge */}
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryText}>
              {article.category === 'news' ? 'Tin tức' : article.category}
            </Text>
          </View>

          {/* Title */}
          <Text style={styles.title}>{article.title}</Text>

          {/* Meta Info */}
          <View style={styles.metaContainer}>
            <View style={styles.metaItem}>
              <Calendar size={14} color="#95A99C" />
              <Text style={styles.metaText}>{article.date}</Text>
            </View>
            {article.read_time && (
              <View style={styles.metaItem}>
                <Clock size={14} color="#95A99C" />
                <Text style={styles.metaText}>{article.read_time}</Text>
              </View>
            )}
            {article.source && (
              <View style={styles.metaItem}>
                <Text style={styles.metaText}>• {article.source}</Text>
              </View>
            )}
          </View>

          {/* Description */}
          <Text style={styles.description}>{article.description}</Text>

          {/* Content */}
          {article.content && article.content.length > 0 && (
            <View style={styles.contentSection}>
              <Text style={styles.sectionTitle}>Nội dung</Text>
              <Text style={styles.contentText}>
                {article.content.replace(/\[\+\d+ chars\]/g, '...')}
              </Text>
              {article.content.includes('[+') && (
                <Text style={styles.truncatedNote}>
                  * Nội dung đầy đủ có trong bài gốc
                </Text>
              )}
            </View>
          )}

          {/* Author */}
          {article.author && article.author !== 'NewsAPI' && (
            <View style={styles.authorSection}>
              <Text style={styles.authorLabel}>Tác giả:</Text>
              <Text style={styles.authorText}>{article.author}</Text>
            </View>
          )}

          {/* Original Link Button */}
          {article.url && (
            <TouchableOpacity style={styles.originalButton} onPress={handleOpenOriginal}>
              <ExternalLink size={18} color="#2D6A4F" />
              <Text style={styles.originalButtonText}>Đọc bài gốc</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FBF9',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FBF9',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#95A99C',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FBF9',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: '#1B4332',
    marginBottom: 20,
  },
  backButton: {
    backgroundColor: '#2D6A4F',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E8F5E9',
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F8FBF9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  scrollView: {
    flex: 1,
  },
  image: {
    width: '100%',
    height: 250,
    backgroundColor: '#E8F5E9',
  },
  contentContainer: {
    padding: 16,
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginBottom: 12,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2D6A4F',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1B4332',
    lineHeight: 32,
    marginBottom: 12,
  },
  metaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E8F5E9',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 13,
    color: '#95A99C',
  },
  description: {
    fontSize: 17,
    fontWeight: '500',
    color: '#1B4332',
    lineHeight: 26,
    marginBottom: 20,
  },
  contentSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1B4332',
    marginBottom: 12,
  },
  contentText: {
    fontSize: 16,
    color: '#2D6A4F',
    lineHeight: 24,
  },
  truncatedNote: {
    fontSize: 13,
    fontStyle: 'italic',
    color: '#95A99C',
    marginTop: 12,
  },
  authorSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: '#F0F7F4',
    borderRadius: 12,
    marginBottom: 20,
  },
  authorLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2D6A4F',
  },
  authorText: {
    fontSize: 14,
    color: '#1B4332',
  },
  originalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#2D6A4F',
    marginTop: 12,
  },
  originalButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D6A4F',
  },
});
