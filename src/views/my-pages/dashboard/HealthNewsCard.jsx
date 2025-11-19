'use client'

// React Imports
import { useState } from 'react'

// MUI Imports
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import CircularProgress from '@mui/material/CircularProgress'
import Box from '@mui/material/Box'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import ListItemButton from '@mui/material/ListItemButton'
import ListItemText from '@mui/material/ListItemText'
import Chip from '@mui/material/Chip'
import IconButton from '@mui/material/IconButton'
import Alert from '@mui/material/Alert'
import Divider from '@mui/material/Divider'
import Tooltip from '@mui/material/Tooltip'
import Tab from '@mui/material/Tab'
import TabContext from '@mui/lab/TabContext'
import TabList from '@mui/lab/TabList'
import TabPanel from '@mui/lab/TabPanel'

// Icon Imports
import RefreshIcon from '@mui/icons-material/Refresh'
import OpenInNewIcon from '@mui/icons-material/OpenInNew'
import HealthAndSafetyIcon from '@mui/icons-material/HealthAndSafety'
import ScienceIcon from '@mui/icons-material/Science'

// Service Import
import { healthNewsService } from '@/services/healthNewsService'

const HealthNewsCard = () => {
  const [activeTab, setActiveTab] = useState('all')

  // Fetch latest health news
  const { data: healthNewsData, isLoading, isError, refetch } = healthNewsService.getLatestHealthNews(
    'latestHealthNews',
    20
  )

  // Backend response shapes may vary. Support both:
  // - { success, result: [ ... ] }  (our Node createResponse)
  // - { data: { data: [ ... ] } }  (some other endpoints)
  const healthNews =
    healthNewsData?.data?.result || healthNewsData?.data?.data || []

  // Filter news based on active tab
  const filteredNews =
    activeTab === 'all'
      ? healthNews
      : healthNews.filter(news => news.source === (activeTab === 'nih' ? 'NIH Pakistan' : 'Chughtai Lab'))

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue)
  }

  const handleNewsClick = url => {
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  const handleRefresh = () => {
    refetch()
  }

  // Format date helper
  const formatDate = news => {
    // Prefer month/year display: e.g. "Nov 2025"
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    if (news && news.month && news.year) {
      return `${months[Math.max(0, news.month - 1)]} ${news.year}`
    }

    // Fallback: try parsing ISO date
    if (news && news.date) {
      try {
        const d = new Date(news.date)
        return `${months[d.getMonth()]} ${d.getFullYear()}`
      } catch (e) {
        return ''
      }
    }

    return ''
  }

  // Get source chip color
  const getSourceColor = source => {
    return source === 'NIH Pakistan' ? 'primary' : 'secondary'
  }

  // Get source icon
  const getSourceIcon = source => {
    return source === 'NIH Pakistan' ? <HealthAndSafetyIcon fontSize='small' /> : <ScienceIcon fontSize='small' />
  }

  return (
    <Card>
      <CardHeader
        title='Health News & Advisories'
        subheader='Latest health updates from NIH Pakistan and Chughtai Lab'
        // action={
        //   <Tooltip title='Refresh'>
        //     <IconButton onClick={handleRefresh} disabled={isLoading}>
        //       <RefreshIcon />
        //     </IconButton>
        //   </Tooltip>
        // }
      />
      <Divider />
      <CardContent>
        {isLoading ? (
          <Box display='flex' justifyContent='center' alignItems='center' minHeight={200}>
            <CircularProgress />
          </Box>
        ) : isError ? (
          <Alert severity='error'>Failed to load health news. Please try again later.</Alert>
        ) : healthNews.length === 0 ? (
          <Alert severity='info'>No health news available at the moment.</Alert>
        ) : (
          <TabContext value={activeTab}>
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
              <TabList onChange={handleTabChange} aria-label='health news tabs'>
                <Tab label='All' value='all' />
                <Tab label='NIH Pakistan' value='nih' />
                <Tab label='Chughtai Lab' value='chughtai' />
              </TabList>
            </Box>
            <TabPanel value='all' sx={{ p: 0, pt: 2 }}>
              <NewsListContent news={filteredNews} formatDate={formatDate} getSourceColor={getSourceColor} getSourceIcon={getSourceIcon} handleNewsClick={handleNewsClick} />
            </TabPanel>
            <TabPanel value='nih' sx={{ p: 0, pt: 2 }}>
              <NewsListContent news={filteredNews} formatDate={formatDate} getSourceColor={getSourceColor} getSourceIcon={getSourceIcon} handleNewsClick={handleNewsClick} />
            </TabPanel>
            <TabPanel value='chughtai' sx={{ p: 0, pt: 2 }}>
              <NewsListContent news={filteredNews} formatDate={formatDate} getSourceColor={getSourceColor} getSourceIcon={getSourceIcon} handleNewsClick={handleNewsClick} />
            </TabPanel>
          </TabContext>
        )}
      </CardContent>
    </Card>
  )
}

// News List Component
const NewsListContent = ({ news, formatDate, getSourceColor, getSourceIcon, handleNewsClick }) => {
  if (news.length === 0) {
    return <Alert severity='info'>No news found for this category.</Alert>
  }

  return (
    <List sx={{ maxHeight: 500, overflow: 'auto' }}>
      {news.map((item, index) => (
        <Box key={index}>
          <ListItem disablePadding>
            <ListItemButton onClick={() => handleNewsClick(item.link)}>
              <ListItemText
                primary={
                  <Box display='flex' alignItems='center' gap={1} flexWrap='wrap'>
                    <Typography variant='body2' fontWeight={500} sx={{ flex: 1, minWidth: '200px' }}>
                      {item.title}
                    </Typography>
                    <OpenInNewIcon fontSize='small' color='action' />
                  </Box>
                }
                secondary={
                  <Box display='flex' alignItems='center' gap={1} mt={0.5} flexWrap='wrap'>
                    <Chip
                      label={item.source}
                      size='small'
                      color={getSourceColor(item.source)}
                      icon={getSourceIcon(item.source)}
                      variant='outlined'
                    />
                    <Typography variant='caption' color='text.secondary'>
                      {formatDate(item)}
                    </Typography>
                  </Box>
                }
              />
            </ListItemButton>
          </ListItem>
          {index < news.length - 1 && <Divider />}
        </Box>
      ))}
    </List>
  )
}

export default HealthNewsCard
