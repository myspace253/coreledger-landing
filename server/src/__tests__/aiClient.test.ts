import { describe, expect, it } from 'vitest'
import { checkAiBaseUrlForCommonMistakes } from '../services/aiClient.js'

describe('checkAiBaseUrlForCommonMistakes', () => {
  it('flags a base URL that already includes /chat/completions', () => {
    const issue = checkAiBaseUrlForCommonMistakes('https://api.tokenrouter.com/v1/chat/completions')
    expect(issue).toMatch(/already ends in/)
  })

  it('flags a missing scheme', () => {
    const issue = checkAiBaseUrlForCommonMistakes('api.tokenrouter.com/v1')
    expect(issue).toMatch(/missing a scheme/)
  })

  it('flags http:// against a non-local host', () => {
    const issue = checkAiBaseUrlForCommonMistakes('http://zenmux.ai/api/v1')
    expect(issue).toMatch(/https/)
  })

  it('allows http:// against localhost (e.g. a local dev proxy)', () => {
    expect(checkAiBaseUrlForCommonMistakes('http://localhost:8080/v1')).toBeNull()
  })

  it('accepts a correctly-formed base URL', () => {
    expect(checkAiBaseUrlForCommonMistakes('https://api.tokenrouter.com/v1')).toBeNull()
    expect(checkAiBaseUrlForCommonMistakes('https://zenmux.ai/api/v1')).toBeNull()
  })
})
