import { http, HttpResponse } from 'msw'
import { API_BASE_URL } from './constants'

// 定义mock数据
const mockLatestAnswer = {
  answer: "这是来自mock服务的示例回答。Langsistance是一个强大的AI代理平台，可以处理各种任务。",
  reasoning: "我使用了mock数据来生成这个回答，以演示在没有后端服务的情况下应用如何工作。",
  agent_name: "MockAgent",
  status: "已完成",
  uid: "mock-uid-12345"
}

const mockHealth = {
  status: "healthy",
  timestamp: new Date().toISOString()
}

const mockPublicKnowledge = {
  success: true,
  message: "Knowledge records retrieved successfully",
  data: [
    {
      id: 1,
      userId: "mock-user-123",
      question: "什么是Langsistance？",
      description: "Langsistance平台介绍",
      answer: "Langsistance是一个AI代理平台，可以处理各种任务。",
      public: true,
      modelName: "MockModel",
      toolId: 1,
      params: "{}",
      createTime: "2024-01-01T12:00:00",
      updateTime: "2024-01-01T12:00:00"
    },
    {
      id: 2,
      userId: "mock-user-456",
      question: "如何使用Langsistance？",
      description: "Langsistance使用指南",
      answer: "您可以通过输入问题与Langsistance交互，它会为您提供相关信息。",
      public: true,
      modelName: "MockModel",
      toolId: 2,
      params: "{}",
      createTime: "2024-01-02T12:00:00",
      updateTime: "2024-01-02T12:00:00"
    }
  ],
  total: 2
}

// Mock data for query_knowledge endpoint
const mockKnowledge = {
  success: true,
  message: "Knowledge records retrieved successfully",
  data: [
    {
      id: 3,
      userId: "mock-user-789",
      question: "什么是机器学习？",
      description: "机器学习基础问题",
      answer: "机器学习是人工智能的一个分支，它使计算机能够从数据中学习并做出预测或决策。",
      public: false,
      modelName: "gpt-3.5-turbo",
      toolId: 3,
      params: "{}",
      createTime: "2024-01-03T12:00:00",
      updateTime: "2024-01-03T12:00:00"
    },
    {
      id: 4,
      userId: "mock-user-789",
      question: "如何使用Python进行数据分析？",
      description: "Python数据分析问题",
      answer: "您可以使用pandas、numpy、matplotlib等库来进行Python数据分析。",
      public: false,
      modelName: "gpt-4",
      toolId: 4,
      params: "{}",
      createTime: "2024-01-04T12:00:00",
      updateTime: "2024-01-04T12:00:00"
    }
  ],
  total: 2
}

const mockPublicTools = {
  success: true,
  data: [
    {
      id: 1,
      title: "Mock工具1",
      description: "这是一个模拟工具",
      url: "https://example.com/mock-tool-1"
    },
    {
      id: 2,
      title: "Mock工具2",
      description: "这是另一个模拟工具",
      url: "https://example.com/mock-tool-2"
    }
  ]
}

// 定义请求处理程序
// 定义请求处理程序
export const handlers = [
  // Mock latest_answer endpoint
  http.get(`${API_BASE_URL}/latest_answer`, () => {
    return HttpResponse.json(mockLatestAnswer)
  }),

  // Mock health endpoint
  http.get(`${API_BASE_URL}/health`, () => {
    return HttpResponse.json(mockHealth)
  }),

  // Mock stop endpoint
  http.get(`${API_BASE_URL}/stop`, () => {
    return HttpResponse.json({ message: 'Mock stop request received' })
  }),

  // Mock query endpoint
  http.post(`${API_BASE_URL}/query`, () => {
    return HttpResponse.json({
      answer: "这是mock的查询响应。",
      reasoning: "使用mock数据来模拟后端处理。",
      agent_name: "MockQueryAgent",
      status: "已完成",
      uid: "mock-query-uid-67890"
    })
  }),

  // Mock query_public_tools endpoint
  http.get(`${API_BASE_URL}/query_public_tools`, () => {
    return HttpResponse.json(mockPublicTools)
  }),

  // Mock create_knowledge endpoint
  http.post(`${API_BASE_URL}/create_knowledge`, () => {
    return HttpResponse.json({
      success: true,
      message: "Knowledge record created successfully",
      id: 125
    })
  }),

  // Mock delete_knowledge endpoint
  http.post(`${API_BASE_URL}/delete_knowledge`, () => {
    return HttpResponse.json({
      success: true,
      message: "Knowledge record deleted successfully"
    })
  }),

  // Mock update_knowledge endpoint
  http.post(`${API_BASE_URL}/update_knowledge`, () => {
    return HttpResponse.json({
      success: true,
      message: "Knowledge record updated successfully"
    })
  }),

  // Mock query_knowledge endpoint
  http.get(`${API_BASE_URL}/query_knowledge`, ({ request }) => {
    const url = new URL(request.url)
    const userId = url.searchParams.get('userId')
    const query = url.searchParams.get('query')
    const limit = url.searchParams.get('limit') || '10'
    const offset = url.searchParams.get('offset') || '0'
    
    // 根据查询参数过滤数据
    let filteredData = mockKnowledge.data
    
    if (query) {
      filteredData = filteredData.filter(item =>
        item.question.toLowerCase().includes(query.toLowerCase()) ||
        item.description.toLowerCase().includes(query.toLowerCase()) ||
        item.answer.toLowerCase().includes(query.toLowerCase())
      )
    }
    
    if (userId) {
      filteredData = filteredData.filter(item => item.userId === userId)
    }
    
    const paginatedData = filteredData.slice(
      parseInt(offset),
      parseInt(offset) + parseInt(limit)
    )
    
    return HttpResponse.json({
      success: true,
      message: "Knowledge records retrieved successfully",
      data: paginatedData,
      total: filteredData.length
    })
  }),

  // Mock query_public_knowledge endpoint (updated with query parameters)
  http.get(`${API_BASE_URL}/query_public_knowledge`, ({ request }) => {
    const url = new URL(request.url)
    const query = url.searchParams.get('query')
    const limit = url.searchParams.get('limit') || '10'
    const offset = url.searchParams.get('offset') || '0'
    
    // 根据查询参数过滤数据
    let filteredData = mockPublicKnowledge.data
    
    if (query) {
      filteredData = filteredData.filter(item =>
        item.question.toLowerCase().includes(query.toLowerCase()) ||
        item.description.toLowerCase().includes(query.toLowerCase()) ||
        item.answer.toLowerCase().includes(query.toLowerCase())
      )
    }
    
    const paginatedData = filteredData.slice(
      parseInt(offset),
      parseInt(offset) + parseInt(limit)
    )
    
    return HttpResponse.json({
      success: true,
      message: "Knowledge records retrieved successfully",
      data: paginatedData,
      total: filteredData.length
    })
  }),

  // Mock copy_knowledge endpoint (updated response format)
  http.post(`${API_BASE_URL}/copy_knowledge`, () => {
    return HttpResponse.json({
      success: true,
      message: "Knowledge record copied successfully",
      id: 126
    })
  })
]